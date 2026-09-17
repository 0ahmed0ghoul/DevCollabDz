# DevCollabDz — Portable Project Context

> Purpose: portable context snapshot for restoring the DevCollabDz project in a new conversation or coding assistant session.
>
> Current milestone: **Day 25 complete**. Day 26 is next: Notifications.
> The reliability foundation is now complete through consumer idempotency, retry/dead-letter handling, recovery, and event replay.

---

## 1. PROJECT OVERVIEW

### What we're building

**DevCollabDz** is a full-stack collaborative development platform for Algerian developers and small software teams. It combines organizations/workspaces, projects, team members, tasks/Kanban, realtime collaboration, caching, observability, and a reliable event-driven backend; the project is intentionally being evolved into a portfolio-grade demonstration of full-stack engineering, DevOps, system design, and distributed-systems concepts.

The project is being built incrementally: product functionality comes first, then complexity is introduced only when it solves a real architectural/product problem. The end goal is a professional project suitable for freelance work, internships/jobs, scholarships, and technical portfolio presentation.

### Core goals / requirements

- Demonstrate **full-stack engineering** rather than a CRUD-only application.
- Demonstrate **PWA** capability.
- Demonstrate **DevOps/observability**: Docker, Prometheus, Grafana, structured logging, metrics, worker monitoring.
- Demonstrate **system design and distributed systems**: event-driven architecture, transactional outbox, background worker, idempotency, retries/dead-letter, replay, caching, concurrency, scaling.
- Keep the architecture understandable and incremental; avoid premature microservices/Redis/MongoDB just for complexity.
- Preserve strict organization/project access isolation and authorization.
- Provide reliable realtime task synchronization through Socket.IO.
- Eventually support real collaboration features such as notifications, comments, activity feed, mentions, presence, typing indicators, search, and better Kanban behavior.
- Eventually mature toward production-style deployment/scaling/testing/security/CI/CD.

---

## 2. TECH STACK

### Frontend

- **React**
- **Vite**
- **TypeScript**
- **Tailwind CSS**
- **shadcn/ui**
- **TanStack Router**
- **TanStack Start / SSR**
- **Socket.IO client** for realtime task events
- Browser `localStorage` for current auth token/user persistence
- Frontend API client with Bearer-token authentication and authenticated-401 redirect handling

### Backend

- **Node.js**
- **Express**
- **TypeScript**
- **Prisma 7**
- **PostgreSQL** as the primary relational database
- **`@prisma/adapter-pg`** for Prisma/PostgreSQL
- **JWT** authentication
- **bcrypt** password hashing
- **Zod** for validation (especially runtime validation of realtime payloads)
- **Socket.IO** for realtime communication
- **Redis** for caching and resilience work
- **Pino** for structured logging
- **prom-client** for Prometheus metrics
- **tsx** for TypeScript development/watch execution

### Infrastructure / local development

- Docker / Docker Desktop
- PostgreSQL running through Docker during development
- Redis local instance: `redis://127.0.0.1:6379`
- API: `http://localhost:5000`
- Frontend: `http://localhost:8080`
- Worker metrics server: `http://localhost:9465/metrics`
- Prometheus scrapes API and separate outbox-worker metrics
- Grafana used for dashboards/observability

### Important process split

The API and outbox worker are deliberately separate Node.js processes:

```text
API process
  └── HTTP + Socket.IO
      └── :5000

Worker process
  └── Transactional-outbox processor
      └── :9465/metrics
```

The worker is started with:

```bash
npm run worker
```

The API is started with:

```bash
npm run dev
```

### Prometheus scraping

Current intended configuration:

```yaml
global:
  scrape_interval: 5s

scrape_configs:
  - job_name: "devcollab-api"
    metrics_path: "/api/metrics"
    static_configs:
      - targets:
          - "host.docker.internal:5000"

  - job_name: "devcollab-outbox-worker"
    metrics_path: "/metrics"
    static_configs:
      - targets:
          - "host.docker.internal:9465"
```

A previous failure was caused by Prometheus still targeting `host.docker.internal:5001`; the worker actually listens on **9465**. The worker endpoint has since been verified directly and Prometheus was made to scrape it successfully.

---

## 3. ARCHITECTURE & SYSTEM DESIGN

### 3.1 High-level architecture

```text
                         ┌──────────────────────┐
                         │      React PWA       │
                         │ Vite / TS / Tailwind │
                         └──────────┬───────────┘
                                    │
                         REST + Socket.IO
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │    Express API       │
                         │      :5000            │
                         └───────┬───────┬──────┘
                                 │       │
                         Prisma  │       │ Redis cache
                                 │       │
                                 ▼       ▼
                         ┌──────────┐  ┌─────────┐
                         │PostgreSQL│  │  Redis  │
                         └────┬─────┘  └─────────┘
                              │
                    Task mutation + ApplicationEvent
                              │  (same DB transaction)
                              ▼
                    ┌──────────────────────┐
                    │ ApplicationEvent /   │
                    │ Transactional Outbox │
                    └──────────┬───────────┘
                               │
                               │ polling / claiming
                               ▼
                    ┌──────────────────────┐
                    │  Outbox Worker       │
                    │ separate process     │
                    └──────────┬───────────┘
                               │
                               ▼
                         ┌────────────┐
                         │ Event Bus  │
                         └─────┬──────┘
                               │
                     ┌─────────┴──────────┐
                     ▼                    ▼
              Realtime consumer     Audit consumer
                     │                    │
                     ▼                    ▼
                 Socket.IO            Audit logs

                     Future consumers:
                     Notifications, etc.
```

### 3.2 Authentication / authorization

- JWT-based auth.
- API requests use `Authorization: Bearer <token>`.
- Frontend persists `accessToken` and `user` in localStorage.
- Authenticated route protection uses client-only `beforeLoad` to avoid SSR/localStorage issues:

```ts
beforeLoad: () => {
  if (
    typeof window !== "undefined" &&
    !isAuthenticated()
  ) {
    throw redirect({ to: "/login" });
  }
},
```

- Organization membership and project membership are used for authorization.
- Project roles:
  - `OWNER`
  - `ADMIN`
  - `MEMBER`
- Project membership is represented by `ProjectMember`; the old `memberIds` approach was explicitly removed.
- Cross-organization isolation is enforced in backend policies/services.
- Central auth policies and task/project authorization exist.

### 3.3 Core relational domain model

The project started with these central entities:

- `User`
- `Organization`
- `OrganizationMember`
- `Project`
- `ProjectMember`
- `Task`
- `ApplicationEvent`
- `ProcessedEvent`

Other details:

- Project creation backfills owner membership atomically.
- `ProjectMember` replaces the legacy `memberIds` representation.
- Database roles use enums/constraints where appropriate.

### 3.4 Transactional outbox

Application events are stored in PostgreSQL in the same transaction as the business mutation.

`ApplicationEvent` currently includes:

```prisma
model ApplicationEvent {
  id                  String                 @id @default(cuid())
  eventId             String                 @unique
  type                String
  timestamp           DateTime
  projectId           String?
  actorId             String?
  data                Json
  status              ApplicationEventStatus @default(PENDING)
  attempts            Int                    @default(0)
  lastError           String?
  nextAttemptAt       DateTime?
  processedAt         DateTime?
  processingStartedAt DateTime?
  createdAt           DateTime               @default(now())

  @@index([status])
  @@index([status, nextAttemptAt])
  @@index([type])
  @@index([projectId])
  @@index([actorId])
  @@index([timestamp])
  @@index([createdAt])
}
```

(Exact schema may have formatting/ordering variations; preserve the above fields and indexes as the intended design.)

Status enum:

```text
PENDING
PROCESSING
PROCESSED
FAILED
DEAD_LETTER
```

Task create/update/delete does:

```text
Task mutation
    +
ApplicationEvent
    ↓
ONE PostgreSQL transaction
    ↓
commit
    ↓
Outbox worker later publishes event
```

The service no longer publishes synchronously immediately after writing the task. The outbox worker owns delivery.

### 3.5 Outbox worker

Worker behavior:

- Poll interval: `1000 ms`
- Batch size: `20`
- Maximum attempts: `5`
- Processing timeout for stuck events: `30,000 ms`
- Events in `PROCESSING` with old `processingStartedAt` are reset to `PENDING`.
- Pending events are conditionally claimed by changing `PENDING → PROCESSING` and incrementing `attempts`.
- This conditional claim protects against duplicate processing across multiple worker instances.
- Successful processing becomes `PROCESSED`.
- Failed processing uses exponential backoff, capped at `30,000 ms`.
- After 5 attempts the event becomes `DEAD_LETTER`.

Backoff:

```text
attempt 1 → 1s
attempt 2 → 2s
attempt 3 → 4s
attempt 4 → 8s
... capped at 30s
```

Current outbox store has a centralized `claimPendingEvents()` helper with conditional `updateMany` claim semantics.

### 3.6 Outbox worker metrics

Metrics currently include:

```text
devcollab_outbox_pending_events
devcollab_outbox_processed_total
devcollab_outbox_failed_total
devcollab_outbox_processing_duration_seconds
devcollab_outbox_worker_alive
devcollab_outbox_worker_heartbeat_timestamp
```

Worker health strategy:

- Do **not** expose `/api/health/worker` from the API because that would only report API-process health.
- Use a dedicated worker metrics endpoint and Prometheus/Grafana.

Worker metrics endpoint:

```text
GET http://localhost:9465/metrics
```

Worker process sets:

```text
devcollab_outbox_worker_alive = 1 while running
devcollab_outbox_worker_heartbeat_timestamp = last successful poll timestamp
```

Observed and verified:

```text
devcollab_outbox_worker_alive 1
devcollab_outbox_worker_heartbeat_timestamp <current unix timestamp>
```

### 3.7 Event Bus

A typed internal event bus is implemented in:

```text
apps/api/src/events/event-bus.ts
```

Event types currently include:

- `task.created`
- `task.updated`
- `task.deleted`

Events carry metadata including:

- `eventId`
- `timestamp`
- `type`
- typed `data`

The bus supports subscriber handlers, retries, and subscriber failure isolation. Worker processing uses `eventBus.publish(event)`.

### 3.8 Realtime architecture

Socket.IO is used for realtime task events.

- Backend authenticates socket connections using JWT.
- Clients join project rooms.
- Realtime events include task create/update/delete.
- Frontend automatically reconnects.
- Projects are rejoined after reconnect.
- Reconnect triggers REST resync.
- Stale/out-of-order event protection uses `updatedAt`.
- Deleted-task protection prevents stale updates from recreating deleted state.
- Event IDs are deduplicated client-side with a bounded set/queue of roughly 500 IDs.

Frontend Socket.IO auth callback must be:

```ts
auth: (cb) => {
  cb({ token: getAccessToken() });
}
```

This fixed a prior socket authentication issue.

### 3.9 Shared realtime contract

Shared type-only realtime event contracts live at:

```text
packages/realtime/src/events.ts
```

The shared package remains **type-only** and must not gain a runtime Zod dependency.

Frontend realtime event code lives at:

```text
apps/web/src/realtime/task-events.ts
```

Frontend imports the shared types and performs local Zod runtime validation.

### 3.10 Idempotency

Day 23 introduced consumer idempotency.

Model:

```prisma
model ProcessedEvent {
  id          String   @id @default(cuid())
  eventId     String
  consumer    String
  processedAt DateTime @default(now())

  @@unique([eventId, consumer])
  @@index([eventId])
  @@index([consumer])
}
```

Rationale:

- The same event may be processed by multiple different consumers.
- Each `(eventId, consumer)` pair must be processed at most once.

Atomic claim implementation uses the unique constraint and Prisma error code `P2002`:

```text
claimEvent(eventId, consumer)
    ↓
ProcessedEvent.create()
    ├── success → true
    └── P2002   → false
```

This was concurrency-tested with 3 simultaneous claims. Exactly one returned `true`; the other two returned `false`.

The actual Event Bus was also tested by publishing the same event twice. Exactly one consumer side effect occurred and exactly one idempotency record existed.

Current consumer names:

```text
realtime
audit
```

The ordering is intentionally:

```text
atomic claim
    ↓
perform side effect
```

The `hasProcessedEvent()` / `markEventProcessed()` approach was replaced by an atomic `claimEvent()` design after identifying a concurrency race.

### 3.11 Caching

Redis is used for cache-aside behavior.

Cached areas include project lists and task lists.

Design decisions:

- Query-specific cache keys.
- Centralized cache utilities/keys.
- Cache invalidation on mutation.
- Cache stampede protection.
- Hit/miss metrics.
- Redis readiness metric.
- Resilience/fallback/reconnect behavior.
- Authentication/authorization remains independent of cache success.

Metrics include:

```text
devcollab_cache_hits_total
devcollab_cache_misses_total
devcollab_redis_ready
```

### 3.12 Pagination / query performance

The project includes:

- pagination
- filtering
- search
- sorting
- stable pagination behavior
- composite DB indexes
- N+1 query optimization
- relation-query optimization
- task query optimization
- query audit
- query duration metrics

### 3.13 Observability

Structured logging uses **Pino**.

Implemented observability includes:

- request IDs
- request lifecycle logging
- error logging
- database query duration metrics
- Redis readiness metrics
- HTTP request count/duration metrics
- cache hit/miss metrics
- outbox processing metrics
- worker heartbeat/alive metrics
- Grafana dashboard work

HTTP metrics include:

```text
devcollab_http_requests_total
devcollab_http_request_duration_seconds
devcollab_database_query_duration_seconds
```

API metrics endpoint:

```text
GET /api/metrics
```

### 3.14 Consistency / delivery semantics

The current architecture intentionally uses **at-least-once-style reliable event delivery**, then adds consumer idempotency so duplicate delivery becomes harmless.

The system favors:

- database transaction for source-of-truth mutation + event creation
- eventual asynchronous delivery through outbox worker
- retries for transient failures
- dead-letter state for exhausted events
- consumer-level idempotency
- explicit recovery for stuck processing

This is preferred over pretending the entire system can be globally exactly-once.

### 3.15 Planned scaling direction

Not all of this is implemented yet.

Planned future work includes:

- Redis-backed Socket.IO adapter for horizontal scaling
- load balancing / reverse proxy
- multiple API instances
- production deployment with Docker Compose
- SLOs
- load testing
- distributed failure simulation
- stronger concurrency controls
- CQRS/read models
- background jobs beyond the outbox

---

## 4. DESIGN PATTERNS USED

### Service Layer

**Where:** task/project/domain services.

**Why:** keeps business rules out of HTTP controllers and gives transactions/event creation a clear home.

### Repository / Store boundary

**Where:** database-specific helpers such as `outbox-store.ts` and `event-store.ts`.

**Why:** centralizes persistence concerns and keeps worker/service logic from mixing SQL/Prisma mechanics with orchestration.

### Unit of Work / Transaction Boundary

**Where:** task mutations plus `ApplicationEvent` creation in one Prisma `$transaction`.

**Why:** guarantees the business mutation and its durable event either both commit or both roll back.

### Observer / PubSub

**Where:** internal `eventBus`.

**Why:** allows realtime, audit, and future notifications to subscribe independently without coupling task services directly to every side effect.

### Event-driven architecture

**Where:** `Task → ApplicationEvent → Outbox → Worker → EventBus → Consumers`.

**Why:** isolates synchronous request handling from asynchronous side effects and gives reliability/retry/replay opportunities.

### Outbox Pattern

**Where:** `ApplicationEvent` table + outbox worker.

**Why:** avoids the dual-write problem of updating PostgreSQL and sending an external/event-bus message independently.

### Idempotency pattern

**Where:** `ProcessedEvent` with unique `(eventId, consumer)` claim.

**Why:** makes at-least-once delivery safe and handles duplicate deliveries/concurrent claims.

### Strategy / policy-style authorization

**Where:** centralized authorization policies/role checks for organizations/projects/tasks.

**Why:** keeps access rules consistent instead of embedding them ad hoc in controllers.

### Middleware

**Where:** authentication, request IDs, logging, validation/error handling.

**Why:** cross-cutting behavior belongs outside feature services/controllers.

### Adapter

**Where:** Prisma PostgreSQL adapter (`@prisma/adapter-pg`), and planned Redis Socket.IO adapter later.

**Why:** isolates infrastructure-specific integration behind standard interfaces.

### Factory / event metadata creation

**Where:** event bus metadata creation (`createMetadata()` / `create()`).

**Why:** centralizes event ID/timestamp generation so the same event identity is used across persistence, retries, audit, and realtime delivery.

### Cache-aside

**Where:** Redis for project/task list reads.

**Why:** improves read performance while PostgreSQL remains the source of truth.

---

## 5. MODULE / COMPONENT STATUS

### Authentication

**Status:** DONE

Includes:

- JWT auth
- bcrypt
- frontend token persistence
- authenticated API client
- 401 handling
- route protection
- Socket.IO JWT auth

**Unresolved:** eventual production token/session hardening may still be needed.

### Organizations / workspace

**Status:** DONE

Includes:

- organization management
- organization membership
- workspace isolation
- organization member UI
- authorization policies

### Projects

**Status:** DONE

Includes:

- CRUD
- project settings
- project membership
- project roles
- atomic owner membership creation
- project/member authorization

### Project members

**Status:** DONE

Model:

```text
ProjectMember
ProjectRole = OWNER | ADMIN | MEMBER
```

Legacy `memberIds` was removed and must not be reintroduced.

### Tasks / Kanban

**Status:** DONE / CONTINUOUSLY EXPANDING

Includes:

- task CRUD
- status transitions
- Kanban behavior
- pagination/filter/search/sort
- authorization
- Redis cache
- realtime create/update/delete
- optimistic update foundation

**Future:** task ordering, comments, mentions, richer collaboration.

### REST API quality

**Status:** DONE

Includes:

- request IDs
- structured logging
- centralized error handling
- Prisma error normalization
- validation
- query optimization
- route metrics

### Redis caching

**Status:** DONE

Includes:

- cache-aside
- TTL
- query-specific keys
- invalidation
- stampede protection
- hit/miss metrics
- resilience/reconnect/fallback

### Realtime Socket.IO

**Status:** DONE

Includes:

- JWT socket auth
- project rooms
- task event delivery
- reconnection
- room rejoin
- REST resync after reconnect
- stale event protection
- idempotent create behavior
- frontend event validation
- shared type contracts

**Future:** presence, typing indicators, Redis Socket.IO adapter for horizontal scale.

### Internal event bus

**Status:** DONE

Includes:

- typed events
- application metadata
- retries
- subscriber isolation
- realtime consumer
- audit consumer

### Persistent application events

**Status:** DONE

Includes:

- `ApplicationEvent`
- transaction-aware persistence
- event IDs
- timestamps
- project/actor metadata
- JSON payload

### Transactional outbox

**Status:** DONE

Includes:

- PENDING/PROCESSING/PROCESSED/FAILED/DEAD_LETTER
- transactional creation
- worker polling
- conditional claims
- stuck-event recovery
- retry/backoff
- dead-lettering
- separate worker process

### Outbox worker

**Status:** DONE

Includes:

- separate process
- graceful shutdown
- stale PROCESSING recovery
- worker metrics endpoint
- heartbeat/alive metrics
- Prometheus scraping

### Monitoring / observability

**Status:** DONE for current scope

Includes:

- Pino
- Prometheus
- Grafana
- API metrics
- worker metrics
- HTTP metrics
- DB query metrics
- Redis readiness
- outbox metrics
- worker heartbeat/alive

**Future:** formal alert rules/dashboard refinements/SLOs.

### Event idempotency

**Status:** DONE — Day 23

Includes:

- `ProcessedEvent`
- unique `(eventId, consumer)`
- atomic `claimEvent()`
- concurrency test
- duplicate Event Bus test
- realtime/audit consumers wired for idempotency

### Retry / dead-letter hardening

**Status:** DONE — Day 24

Day 24 hardened and validated the existing outbox retry/DLQ implementation rather than rebuilding it.

Implemented:

- Exponential retry backoff
- Maximum 5 processing attempts
- `DEAD_LETTER` transition after exhausted attempts
- Explicit retry metric
- Explicit dead-letter metric
- Manual dead-letter recovery
- Recovery resets attempts to `0`
- Requeued events return to `PENDING`
- Worker can subsequently process recovered events
- Full dead-letter recovery path was tested

Retry metrics:
devcollab_outbox_retries_total
devcollab_outbox_dead_letter_total


### Event replay

**Status:** NOT STARTED — planned Day 25

Goal: safely replay durable events for recovery/debugging/rebuild workflows.

### Notifications

**Status:** NOT STARTED — planned around Day 26

Planned pipeline:

```text
Task event
   ↓
Outbox
   ↓
Worker
   ↓
Event Bus
   ↓
Notification consumer
   ↓
Notification DB record
   ↓
Socket.IO
   ↓
User notification UI
```

First planned notification types:

- mention
- task assigned
- task status changed
- task comment
- added to project

### Other planned product features

**Status:** NOT STARTED

- comments
- activity feed
- mentions
- Kanban ordering improvements
- optimistic UI expansion
- presence
- typing indicators
- search
- notification preferences

### Production / scalability

**Status:** NOT STARTED / ROADMAP

Planned:

- Docker Compose production layout
- reverse proxy
- load balancing
- horizontal Socket.IO scaling with Redis adapter
- SLOs
- load testing
- distributed failure simulation

### Testing maturity

**Status:** PARTIAL / ROADMAP

Already done:

- manual API/regression tests
- realtime two-browser tests
- reconnect/offline/stale event tests
- outbox failure injection
- idempotency concurrency test
- Event Bus duplicate-delivery test

Future:

- unit tests
- integration tests
- E2E tests
- contract tests
- CI/CD test automation

### Security hardening

**Status:** PARTIAL / ROADMAP

Already present:

- auth
- role checks
- organization/project isolation
- validation
- cross-org protection

Future:

- broader security hardening
- rate limiting
- API idempotency
- stronger production token/session posture
- security documentation

---

## 6. KEY DECISIONS LOG

### PostgreSQL over MongoDB for the core database

**Chosen:** PostgreSQL.

**Rejected:** MongoDB as the primary store.

**Why:** the domain is relational (users, organizations, memberships, projects, tasks, roles, events), and transaction boundaries are central to the design. PostgreSQL provides the consistency/constraints needed by the transactional outbox and idempotency models.

### Do not add microservices early

**Chosen:** modular monolith + separate worker process.

**Rejected:** premature microservices.

**Why:** the project goal is to learn system design progressively and avoid operational complexity without a concrete need. A separate worker gives real asynchronous/distributed behavior without turning every feature into a service.

### Project membership via `ProjectMember`

**Chosen:** normalized `ProjectMember` relation + `ProjectRole` enum.

**Rejected:** legacy `memberIds` list.

**Why:** relational integrity, authorization, scalable membership queries, and cleaner role handling.

### Transactional outbox instead of synchronous publish after mutation

**Chosen:** persist mutation + `ApplicationEvent` atomically, then publish asynchronously.

**Rejected:** direct event publication after the database mutation.

**Why:** direct publication creates the dual-write/crash window. Transactional outbox makes event persistence part of the database transaction.

### Separate worker process

**Chosen:** API and outbox worker are separate Node.js processes.

**Rejected:** running the worker loop inside the API process.

**Why:** independent lifecycle, fault isolation, easier horizontal scaling and operational monitoring.

### Worker health via dedicated metrics, not API health endpoint

**Chosen:** worker `/metrics` endpoint + Prometheus/Grafana.

**Rejected:** `/api/health/worker` from the API.

**Why:** an API endpoint inside the API process cannot truthfully represent a separate worker process.

### Worker metrics port 9465

**Chosen:** worker metrics at `:9465`.

**Previous mistaken target:** Prometheus had `:5001`.

**Resolution:** Prometheus now scrapes `host.docker.internal:9465`.

### At-least-once delivery + idempotent consumers

**Chosen:** allow duplicates and make consumers safe.

**Rejected:** designing around a promise of global exactly-once execution.

**Why:** distributed systems can duplicate delivery around crashes/retries; durable idempotency is a practical correctness strategy.

### Atomic idempotency claim

**Chosen:** insert into `ProcessedEvent` and treat unique constraint `P2002` as “already processed.”

**Rejected:** separate `hasProcessedEvent()` followed by `markEventProcessed()` as the final mechanism.

**Why:** a check-then-insert race allows two consumers to both see “not processed” and both execute side effects. The unique constraint provides an atomic winner.

### Shared realtime contracts are type-only

**Chosen:** `packages/realtime/src/events.ts` contains shared TypeScript types only.

**Rejected:** adding Zod runtime dependency to shared package.

**Why:** frontend runtime validation can stay local while the shared package remains lightweight and type-only.

### Frontend Zod runtime validation is local

**Chosen:** `apps/web/src/realtime/task-events.ts` owns runtime schemas.

**Why:** the browser needs payload validation, but shared contract package stays framework/runtime agnostic.

### Socket.IO reconnect strategy

**Chosen:** reconnect + room rejoin + REST resync + stale-event filtering.

**Why:** realtime transports can disconnect or deliver events around reconnect boundaries; REST resync restores authoritative state.

### Redis is a cache, not the source of truth

**Chosen:** PostgreSQL remains authoritative.

**Why:** cache failure must not become data loss or an authorization bypass.

### Cache invalidation is explicit

**Chosen:** mutation-triggered invalidation with query-specific cache keys.

**Why:** prevent stale project/task list reads while retaining useful caching.

### Worker claim via conditional update

**Chosen:** fetch pending candidates then `updateMany` with `status: PENDING` condition before processing.

**Why:** multiple workers can race to claim the same event; only one should succeed.

### Stuck-processing recovery

**Chosen:** `processingStartedAt` + 30s timeout.

**Why:** a worker can crash after claiming an event and leave it in `PROCESSING`; recovery returns it to `PENDING`.

### Existing retry/dead-letter logic remains part of outbox

**Chosen:** preserve the current worker retry/backoff/dead-letter implementation and harden it incrementally.

**Why:** it already works; Day 24 should improve semantics rather than duplicate/rewrite working infrastructure.

---

## 7. OPEN QUESTIONS / TODO

### Immediate next work

1. **Day 24 — Retry + Dead Letter hardening**
   - Validate consumer failures and retry semantics.
   - Ensure attempt counts and status transitions are correct.
   - Validate recovery after worker/process crashes.
   - Refine dead-letter observability.

2. **Day 25 — Event Replay**
   - Build a controlled replay mechanism from durable `ApplicationEvent` records.
   - Replay must interact safely with consumer idempotency.
   - Decide whether replay bypasses or uses normal outbox statuses.

3. **Day 26+ — Notifications**
   - Notification persistence model.
   - Notification consumer.
   - Realtime delivery.
   - Notification center.
   - Read/unread state.
   - Preferences/type filtering.

### Important future architecture questions

- How exactly should replay behave with existing `ProcessedEvent` records?
- Should replay use a new event identity or preserve original `eventId`?
- What is the lifecycle/retention policy for `ApplicationEvent` records?
- How should dead-letter events be inspected/replayed from UI/admin tooling?
- Should worker metrics remain a separate registry from API metrics permanently, or should common/base metrics be shared while worker-only metrics remain worker-owned?
- How should notification consumers claim idempotency when a notification has user-specific side effects?
- How should Socket.IO scale horizontally using the Redis adapter once multiple API instances exist?
- What concurrency control is needed for Kanban ordering?
- Where should CQRS/read models become justified rather than premature?
- What is the final production deployment topology?

### Future Day/feature roadmap

```text
Day 23  → Idempotency                         ✅ DONE
Day 24  → Retry + Dead Letter hardening       NEXT
Day 25  → Event Replay                        PLANNED
Day 26  → Notifications foundation            PLANNED
Day 27  → Notification persistence + API      PLANNED
Day 28  → Realtime notification delivery     PLANNED
Day 29  → Read/unread + notification center  PLANNED
Day 30  → Notification preferences/types      PLANNED

Day 31–34  → Comments / activity / mentions / richer collaboration
Day 35–42  → rate limiting, API idempotency, concurrency, CQRS,
             background jobs, distributed failure simulation
Day 43–48  → production Docker, reverse proxy, scaling, Socket.IO
             Redis adapter, SLOs, load testing
Day 49–55  → unit/integration/E2E/contract tests, CI/CD,
             security hardening, architecture docs
```

---

## 8. CONVENTIONS & STANDARDS

### Repository / app structure

Current backend structure started around:

```text
apps/api/src/
├── modules/
│   ├── auth/
│   ├── users/
│   ├── organizations/
│   ├── projects/
│   └── tasks/
├── config/
├── database/
├── middleware/
├── utils/
├── events/
├── realtime/
├── metrics/
├── generated/
├── app.ts
├── server.ts
└── worker.ts
```

Key known files:

```text
apps/api/src/events/event-bus.ts
apps/api/src/events/event-store.ts
apps/api/src/events/outbox-store.ts
apps/api/src/events/outbox-processor.ts
apps/api/src/events/idempotency-store.ts
apps/api/src/events/audit-event-handlers.ts
apps/api/src/realtime/realtime-dispatcher.ts
apps/api/src/realtime/realtime-event-handlers.ts
apps/api/src/realtime/realtime-events.ts
apps/api/src/realtime/task-events.ts       # backend version was deleted; do not recreate
apps/api/src/metrics/metrics.ts
apps/api/src/metrics/worker-metrics-server.ts
apps/api/src/worker.ts
apps/api/src/server.ts
apps/api/src/generated/prisma/client.js
packages/realtime/src/events.ts
apps/web/src/realtime/task-events.ts
```

### Prisma generated client

Prisma generated client is under:

```text
apps/api/src/generated/prisma
```

Use imports like:

```ts
import { prisma } from "../database/prisma.js";
```

and for Prisma types when needed:

```ts
import type { Prisma } from "../generated/prisma/client.js";
```

A previous Prisma 7 issue was caused by importing Prisma types from `index.js`; use `client.js` for generated Prisma types.

### TypeScript / module conventions

- ESM-style imports with `.js` extensions in TypeScript source.
- Run `npx tsc --noEmit` frequently after each focused step.
- Prefer exact, focused modifications over broad rewrites.
- Do not reintroduce deleted legacy structures.

### Event naming

Current event names:

```text
task.created
task.updated
task.deleted
```

Event identity is created once and preserved across:

```text
DB ApplicationEvent
→ Event Bus
→ audit
→ realtime
→ future consumers
```

### Consumer naming

Current idempotency consumer names:

```text
"realtime"
"audit"
```

Future consumers should use explicit stable names, e.g. `"notifications"`.

### Error handling

- Use structured logger (`logger.info`, `logger.warn`, `logger.error`, `logger.debug`).
- Normalize/handle Prisma-specific errors where appropriate.
- For idempotency claims, identify Prisma `P2002` rather than matching human-readable error strings.
- Subscriber failures must be isolated so one consumer cannot take down unrelated consumers.

### Metrics conventions

Metrics use `prom-client` and a custom `metricsRegistry`.

Current metric prefixes:

```text
devcollab_*
```

Worker-specific metrics should be interpreted from the worker process, not from the API process's separate in-memory registry.

### Monitoring queries discussed

Worker stopped:

```promql
devcollab_outbox_worker_alive == 0
```

Heartbeat stale:

```promql
time() - devcollab_outbox_worker_heartbeat_timestamp > 10
```

Backlog:

```promql
devcollab_outbox_pending_events > 20
```

Recent failures:

```promql
increase(devcollab_outbox_failed_total[5m]) > 0
```

Processing rate:

```promql
rate(devcollab_outbox_processed_total[5m])
```

### Coding style / workflow preference

- Work **day-by-day** with explicit milestones.
- Each step should state the exact file path and exact change.
- Prefer full replacement files when a file is small and the intended result is unambiguous.
- Avoid repeating already-completed setup.
- After a focused change, run:

```bash
npx tsc --noEmit
```

- Then perform a runtime/integration test where the feature matters.
- Do not introduce complexity unless it supports the current learning/product milestone.
- Keep the user-visible product growing while using infrastructure work to support it.

### Important non-negotiable project rules

- Do not bring back `memberIds`.
- Do not bypass backend authorization because frontend membership hides an option.
- Do not treat Redis as authoritative data storage.
- Do not directly couple task services to Socket.IO for new event-driven features; route side effects through application events/consumers.
- Do not move worker health back into an API health endpoint.
- Do not make shared realtime types depend on Zod runtime code.
- Do not replace the transactional outbox with direct synchronous event publication.
- Do not assume exactly-once execution; rely on durable events + idempotent consumers.

---

# CURRENT STATUS SNAPSHOT

```text
DevCollabDz

Foundation                         ✅
Auth                              ✅
Organizations/workspaces          ✅
Projects                          ✅
Project members/RBAC              ✅
Tasks/Kanban                      ✅
Pagination/query optimization     ✅
Redis caching                     ✅
Structured logging                ✅
Prometheus/Grafana                ✅
Socket.IO realtime                ✅
Reliable reconnect/resync         ✅
Typed application events          ✅
Persistent ApplicationEvent       ✅
Transactional outbox              ✅
Separate outbox worker             ✅
Worker monitoring                 ✅
Consumer idempotency              ✅ Day 23

Retry/DLQ hardening               ⏭ Day 24
Event replay                       ⏭ Day 25
Notifications                      ⏭ Day 26+
```

## Current reliable event pipeline

```text
HTTP task mutation
      ↓
Task Service
      ↓
PostgreSQL transaction
  ┌───────────────────────┐
  │ Task mutation         │
  │ ApplicationEvent      │
  └───────────────────────┘
      ↓ commit
ApplicationEvent = PENDING
      ↓
Outbox Worker
      ↓ atomic claim
PROCESSING
      ↓
Event Bus
      ├───────────────┐
      ↓               ↓
Realtime          Audit
consumer          consumer
      ↓               ↓
claimEvent()     claimEvent()
      ↓               ↓
Socket.IO        audit side effect

Failure:
  retry → backoff → DEAD_LETTER

Duplicate:
  claimEvent() → one winner → duplicate ignored
```

## Current next milestone

**Day 24 — Retry + Dead Letter hardening.**

Do not jump to notifications yet. Finish the reliability sequence first:

```text
Day 23 ✅
     ↓
Day 24 → Retry / DLQ hardening
     ↓
Day 25 → Event replay
     ↓
Day 26 → Notifications
```
