A collaborative platform for software development teams to manage projects, tasks, communication, and team activity in one place.

First target user

Small software development teams.

Core features

For V1:

Authentication
Organizations
Teams
Projects
Tasks
Comments
Notifications
Real-time updates
Dashboard

DAY 1 — DEVCOLLAB ✅

✓ Project structure
✓ Frontend foundation
✓ Backend skeleton
✓ Express API
✓ /api/health
✓ PostgreSQL schema
✓ Prisma
✓ Docker
✓ PostgreSQL running in Docker
✓ Prisma 7 adapter setup

Day 2 — Authentication ✅

## Completed

- Added Zod validation
- Added password hashing with bcrypt
- Added user registration
- Added user login
- Added JWT authentication
- Added authentication middleware
- Added protected /api/users/me endpoint
- Connected authentication to PostgreSQL

## Architecture

Request
→ Route
→ Middleware
→ Controller
→ Service
→ Prisma
→ PostgreSQL

## Organizations

□ Create organization
□ Creator automatically becomes OWNER
□ Get organization
□ Only members can access organization

Members
□ Add member
□ Prevent duplicate members
□ List members
□ MEMBER / ADMIN / OWNER roles

RBAC
□ OWNER permissions
□ ADMIN permissions
□ MEMBER restrictions
□ Change member roles
□ Prevent arbitrary OWNER creation
□ Protect unauthorized organizations

DevCollab — Day 5
✅ Added TypeScript strict checking with npx tsc --noEmit
✅ Fixed JWT/Express TypeScript errors
✅ Fixed route parameter typing
✅ Completed organization role management
OWNER can change roles
Supports ADMIN / MEMBER
OWNER cannot be demoted
✅ Completed Task Management foundation
Task schema
Controllers
Services
Validation
Project ↔ Task relationships
Task assignees
✅ Improved authentication + organization authorization
✅ Verified backend compiles with 0 TypeScript errors


Day 6 — Finish Backend Foundation

We've already completed:

✅ Authentication
✅ Organizations
✅ Team/member roles
✅ Projects
✅ Tasks
✅ Authorization
✅ Validation
✅ PostgreSQL + Prisma

                    DevCollab
                       │
          ┌────────────┴────────────┐
          │                         │
      Frontend                    Backend
       ✅ MVP                      ✅ Core API
          │                         │
     React/Vite                 Express/Node
     TypeScript                 JWT Auth
     Tailwind                   Prisma
     shadcn/ui                  PostgreSQL
     React Router               Organizations
     Mock data                  Roles/RBAC
     Kanban UI                  Projects
     Dashboard                  Tasks
     Responsive UI

     Day 7 — What we did so far
🔐 Connected frontend authentication to the real backend
Login now stores the JWT accessToken.
Stored authenticated user in localStorage.
Added isAuthenticated() and requireAuth().
Protected routes such as /dashboard.
🌐 Created frontend API client
Centralized GET, POST, PATCH, and DELETE requests.

Automatically sends:

Authorization: Bearer <token>
Handles API errors consistently.
🏢 Connected Organizations API
Get current user's organizations.
Get organization details.
Get organization members.
Create organizations.
Add members.
Update member roles.
Implemented OWNER / ADMIN / MEMBER roles.
🛡️ Implemented backend authorization
JWT authentication middleware.
Organization membership verification.
Role-based authorization middleware.
OWNER protection for role changes.
Prevented organization owners from being demoted.
📁 Connected Projects API
Create projects.
Get organization projects.
Get individual projects.
Projects verify organization membership before access.
🔄 Migrated WorkspaceProvider from mock users/organizations/projects to API data
Authenticated user comes from the real backend.
Organizations come from PostgreSQL.
Organization members come from PostgreSQL.
Projects come from PostgreSQL.
Added loading/error states.
Added refreshWorkspace().
🧩 Kept the migration incremental
Tasks, comments, activities and notifications are still mocked for now.
This avoids changing the entire application at once.
🐛 Fixed TypeScript issues
Fixed nullable currentUser handling.
Removed incorrect authenticatedUser usage.
npx tsc --noEmit now passes with 0 errors.
🧪 Verified backend endpoints
Authentication test → 200 OK
Organization endpoints → 200 OK
Project endpoints → 200 OK


Day 6 — Authentication & Frontend Integration
Added a proper authenticated route boundary using TanStack Router.
Separated public routes (/, /login, /register) from protected workspace routes.
Moved WorkspaceProvider out of the global root and into _authenticated.
Added centralized authentication checks and redirects to /login.
Refactored WorkspaceProvider to safely handle nullable authentication state.
Connected registration UI to the real /api/auth/register endpoint.
Connected login UI to the real /api/auth/login endpoint.
Added JWT/session persistence using localStorage.
Centralized JWT handling in the frontend API client.
Added centralized 401 session handling and logout/redirect behavior.
Migrated organizations, members, and projects from mock data to the real backend API.
Connected project creation to POST /api/organizations/:organizationId/projects.
Fixed a middleware architecture bug where the global task router authentication intercepted /auth/login and /auth/register.
Changed task authentication to apply only to actual task endpoints.
Verified login and registration work end-to-end and successful login redirects to /dashboard.
npx tsc --noEmit passes with 0 errors.



What we've completed in Day 7 so far

Real task API integration.
Real task loading per project.
Real task creation through PostgreSQL.
Five backend-supported workflow states:
BACKLOG
TODO
IN_PROGRESS
REVIEW
DONE
Explicit frontend ↔ backend status mapping.
Real task status updates with PATCH.
Optimistic Kanban updates.
Rollback when an update fails.
Per-project task loading/error states.
Async task mutation architecture.
TypeScript clean on both frontend and backend.
Verified the Kanban persistence flow successfully.

Day 7 — Completed
✅ Real task loading from PostgreSQL
✅ Real task creation
✅ Real task updates
✅ Real task deletion
✅ Five Kanban statuses
✅ Status persistence
✅ Priority persistence
✅ Assignee persistence
✅ Optimistic Kanban updates
✅ Rollback on failed updates
✅ Task loading/error states
✅ Workspace onboarding
✅ Persistent authentication
✅ Login/logout flow
✅ Authenticated landing navbar
✅ User-facing success/error toasts
✅ TypeScript clean on frontend and backend
✅ End-to-end CRUD testing passed

DAY 8 ✅ COMPLETE

Multi-Organization Workspace & Project Management
Added persistent organization selection using localStorage, allowing the selected workspace to survive page refreshes.
Implemented organization switching with automatic reloading of organization members and projects.
Added real organization member management backed by the API.
Implemented organization RBAC for OWNER, ADMIN, and MEMBER roles.
Added member invitation/addition with permission-aware frontend UI and backend authorization.
Added member role management with owner-only role changes and protection against demoting the organization owner.
Reworked the Teams page to use real organization members, assigned tasks, and project ownership instead of the legacy project.memberIds field.
Added real project details loading from the backend.
Implemented full project CRUD for supported fields:
Create projects
View project details
Update project name/description
Delete projects
Added backend authorization for project modification/deletion based on project ownership or organization ownership.
Added Project Settings with editable project information and a destructive-action confirmation dialog.
Added Organization Settings with organization renaming and workspace information.
Added success/error toast notifications for workspace mutations.
Connected project deletion to database cascade behavior so associated tasks are removed with the project.
Refactored the large workspace-store into focused modules:
workspace-context
workspace-provider
workspace-types
workspace-mappers
workspace-organizations
workspace-projects
workspace-tasks
workspace-operations
workspace-storage
Separated backend API models from the existing frontend UI projection models.
Fixed React Rules of Hooks issues in WorkspaceProvider.
Fixed SSR hydration mismatch caused by client-only authentication state in the landing header.
Verified the frontend and backend with npx tsc --noEmit with zero TypeScript errors.

Day 9 ✅

✅ Database role enums
✅ Central authorization policies
✅ Centralized API errors
✅ Prisma error normalization
✅ Data-integrity review
✅ Cross-organization isolation
✅ Task authorization hardening
✅ Request IDs
✅ Structured request logging

DAY 10 ✅

✅ ProjectMember database model
✅ Project-level roles
✅ Atomic project creation
✅ Project member APIs
✅ Project-level authorization
✅ Project-scoped tasks
✅ Project-scoped assignees
✅ Frontend project membership
✅ Legacy memberIds removed
✅ Cross-organization isolation
✅ Final RBAC regression

DAY 11 ✅ COMPLETE

✅ Pagination
✅ Pagination metadata
✅ Filtering
✅ Search
✅ Sorting
✅ N+1 project/member optimization
✅ Frontend query controls
✅ Backend validation
✅ Authorization regression
✅ Performance/query regression

DAY 12 ✅ COMPLETE

✅ Query audit
✅ Composite indexes
✅ Stable pagination
✅ Task query optimization
✅ Relation optimization
✅ N+1 audit
✅ Query measurement
✅ DB enums/constraints
✅ API regression
✅ Frontend regression

Day 13 COMPLETE

✅ Redis integrated
✅ Cache-aside pattern
✅ Project-list cache
✅ Task-list cache
✅ Query-specific keys
✅ TTL
✅ Project invalidation
✅ Task invalidation
✅ Authorization preserved
✅ UI verified

Day 14  COMPLETE

✅ Redis infrastructure
✅ Automatic reconnect
✅ Redis optional for application availability
✅ Centralized cache utilities
✅ Centralized cache keys
✅ Project cache
✅ Task cache
✅ TTL
✅ Cache invalidation
✅ Cache stampede protection
✅ Hit/miss metrics
✅ Redis failure fallback
✅ Authorization preserved
✅ UI verified

Day 15 — Observability

✅ Structured logging with Pino
✅ Request IDs
✅ Request lifecycle logging
✅ Consistent error logging
✅ Prometheus integration
✅ HTTP request metrics
✅ HTTP latency metrics
✅ Database query metrics
✅ Redis availability metrics
✅ Cache hit/miss metrics
✅ Grafana
✅ Monitoring dashboard
✅ Controlled latency testing
✅ HTTP failure testing
✅ Redis failure/recovery testing
✅ API resilience verified
✅ Frontend regression verified

Day 16 — Real-Time Collaboration
Added Socket.IO to the backend and frontend for real-time communication.
Integrated Socket.IO with the existing Node.js HTTP server alongside Express.
Implemented JWT-based WebSocket authentication using the existing access token.
Added project-specific Socket.IO rooms with project membership authorization.
Implemented project room join/leave lifecycle on the frontend.
Added real-time task events:
task:created
task:updated
task:deleted
Integrated real-time events with the central WorkspaceProvider task state.
Connected task mutations to Socket.IO so REST changes are broadcast to connected project members.
Added idempotent task updates to prevent duplicate tasks when the initiating client receives its own event.
Verified real-time synchronization across multiple browser tabs for task creation, updates, and deletion.
Preserved PostgreSQL as the source of truth and Redis cache invalidation alongside real-time updates.
Verified authenticated users can only receive events for projects they belong to.
Added connection, authentication, room, and event logging for real-time observability.
Completed end-to-end real-time task synchronization between project members.

Day 17 — Reliable Real-Time Synchronization
✅ Automatic Socket.IO reconnection
✅ Automatic JWT re-authentication after reconnect
✅ Automatic project-room rejoin after reconnect
✅ Realtime connection status indicator
✅ REST resynchronization after reconnect
✅ Recovery from missed task events while offline
✅ Protection against stale/out-of-order task updates using updatedAt
✅ Idempotent realtime task creation to prevent duplicates
✅ Real-time create/update/delete synchronization verified
✅ Server failure and recovery tested successfully
✅ Offline/reconnect recovery tested successfully
✅ Final end-to-end regression passed

Day 18 status

✅ Structured event envelope
✅ Shared realtime contract
✅ Centralized dispatcher
✅ Runtime validation
✅ Event deduplication
✅ Event correlation/observability
✅ Socket.IO delivery verified
✅ Zod validation verified
✅ Backend TypeScript passes
✅ Frontend TypeScript passes