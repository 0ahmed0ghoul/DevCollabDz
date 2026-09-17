import { prisma } from "../database/prisma.js";
import { eventBus } from "./event-bus.js";
import { logger } from "../utils/logger.js";

import {
  outboxPendingEvents,
  outboxProcessedTotal,
  outboxFailedTotal,
  outboxProcessingDuration,
  outboxWorkerAlive,
  outboxWorkerHeartbeat,
  outboxRetriesTotal,
outboxDeadLetterTotal,
} from "../metrics/metrics.js";

import type {
  ApplicationEvent,
  ApplicationEventMap,
} from "./event-bus.js";

import { claimPendingEvents } from "./outbox-store.js";

const POLL_INTERVAL_MS = 1000;
const MAX_OUTBOX_ATTEMPTS = 5;
const PROCESSING_TIMEOUT_MS = 30_000;

let processorRunning = false;
let shutdownRequested = false;

async function recoverStuckEvents(): Promise<void> {
  const cutoff = new Date(
    Date.now() - PROCESSING_TIMEOUT_MS,
  );

  const result = await prisma.applicationEvent.updateMany({
    where: {
      status: "PROCESSING",
      processingStartedAt: {
        lt: cutoff,
      },
    },
    data: {
      status: "PENDING",
      processingStartedAt: null,
      nextAttemptAt: new Date(),
    },
  });

  if (result.count > 0) {
    logger.warn(
      {
        recoveredEvents: result.count,
        timeoutMs: PROCESSING_TIMEOUT_MS,
      },
      "Recovered stuck outbox events",
    );
  }
}

async function processPendingEvents(): Promise<void> {
  const now = new Date();

  const pendingCount =
    await prisma.applicationEvent.count({
      where: {
        status: "PENDING",
        OR: [
          { nextAttemptAt: null },
          { nextAttemptAt: { lte: now } },
        ],
      },
    });

  outboxPendingEvents.set(pendingCount);

  const events = await claimPendingEvents();

  for (const storedEvent of events) {
    const startedAt = process.hrtime.bigint();

    try {
      switch (storedEvent.type) {
        case "task.created": {
          const event: ApplicationEvent<"task.created"> = {
            eventId: storedEvent.eventId,
            timestamp:
              storedEvent.timestamp.toISOString(),
            type: "task.created",
            data:
              storedEvent.data as ApplicationEventMap["task.created"],
          };

          await eventBus.publish(event);
          break;
        }

        case "task.updated": {
          const event: ApplicationEvent<"task.updated"> = {
            eventId: storedEvent.eventId,
            timestamp:
              storedEvent.timestamp.toISOString(),
            type: "task.updated",
            data:
              storedEvent.data as ApplicationEventMap["task.updated"],
          };

          await eventBus.publish(event);
          break;
        }

        case "task.deleted": {
          const event: ApplicationEvent<"task.deleted"> = {
            eventId: storedEvent.eventId,
            timestamp:
              storedEvent.timestamp.toISOString(),
            type: "task.deleted",
            data:
              storedEvent.data as ApplicationEventMap["task.deleted"],
          };

          await eventBus.publish(event);
          break;
        }

        default:
          throw new Error(
            `Unsupported application event type: ${storedEvent.type}`,
          );
      }

      await prisma.applicationEvent.update({
        where: {
          id: storedEvent.id,
        },
        data: {
          status: "PROCESSED",
          processedAt: new Date(),
          processingStartedAt: null,
          lastError: null,
          nextAttemptAt: null,
        },
      });

      const durationSeconds =
        Number(
          process.hrtime.bigint() - startedAt,
        ) / 1_000_000_000;

      outboxProcessingDuration.observe(
        {
          event_type: storedEvent.type,
        },
        durationSeconds,
      );

      outboxProcessedTotal.inc({
        event_type: storedEvent.type,
      });

      logger.info(
        {
          eventId: storedEvent.eventId,
          eventType: storedEvent.type,
        },
        "Outbox event processed",
      );
    } catch (error) {
      const durationSeconds =
        Number(
          process.hrtime.bigint() - startedAt,
        ) / 1_000_000_000;

      outboxProcessingDuration.observe(
        {
          event_type: storedEvent.type,
        },
        durationSeconds,
      );

      outboxFailedTotal.inc({
        event_type: storedEvent.type,
      });

      const currentAttempt =
        storedEvent.attempts + 1;

      logger.error(
        {
          eventId: storedEvent.eventId,
          eventType: storedEvent.type,
          attempts: currentAttempt,
          error,
        },
        "Outbox event processing failed",
      );

      if (
        currentAttempt >=
        MAX_OUTBOX_ATTEMPTS
      ) {
        await prisma.applicationEvent.update({
          where: {
            id: storedEvent.id,
          },
          data: {
            status: "DEAD_LETTER",
            processingStartedAt: null,
            lastError:
              error instanceof Error
                ? error.message
                : String(error),
            nextAttemptAt: null,
          },
        });
        outboxDeadLetterTotal.inc({
          event_type: storedEvent.type,
        });
        logger.error(
          {
            eventId: storedEvent.eventId,
            eventType: storedEvent.type,
            attempts: currentAttempt,
            error,
          },
          "Outbox event moved to dead letter",
        );

        continue;
      }

      const retryDelayMs = Math.min(
        30_000,
        1_000 *
          2 ** (currentAttempt - 1),
      );

      const nextAttemptAt = new Date(
        Date.now() + retryDelayMs,
      );

      await prisma.applicationEvent.update({
        where: {
          id: storedEvent.id,
        },
        data: {
          status: "PENDING",
          processingStartedAt: null,
          lastError:
            error instanceof Error
              ? error.message
              : String(error),
          nextAttemptAt,
        },
      });
      outboxRetriesTotal.inc({
        event_type: storedEvent.type,
      });
      logger.warn(
        {
          eventId: storedEvent.eventId,
          eventType: storedEvent.type,
          attempts: currentAttempt,
          nextAttemptAt,
          retryDelayMs,
        },
        "Outbox event scheduled for retry",
      );
    }
  }
}

export function stopOutboxProcessor(): void {
  if (!processorRunning) {
    return;
  }

  shutdownRequested = true;
  outboxWorkerAlive.set(0);

  logger.info(
    "Outbox processor shutdown requested",
  );
}

export function startOutboxProcessor(): void {
  if (processorRunning) {
    return;
  }

  processorRunning = true;
  shutdownRequested = false;
  outboxWorkerAlive.set(1);

  logger.info(
    {
      pollIntervalMs: POLL_INTERVAL_MS,
    },
    "Outbox processor started",
  );

  const poll = async () => {
    try {
      await recoverStuckEvents();
      await processPendingEvents();
  
      outboxWorkerHeartbeat.set(
        Math.floor(Date.now() / 1000),
      );
    } catch (error) {
      logger.error(
        { error },
        "Outbox processor poll failed",
      );
    } finally  {
        if (!shutdownRequested) {
          setTimeout(() => {
            void poll();
          }, POLL_INTERVAL_MS);
        } else {
          processorRunning = false;
          outboxWorkerAlive.set(0);

          logger.info(
            "Outbox processor stopped",
          );
        }
      }
  };

  void poll();
}