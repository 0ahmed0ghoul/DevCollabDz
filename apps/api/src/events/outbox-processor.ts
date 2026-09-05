import { prisma } from "../database/prisma.js";
import { eventBus } from "./event-bus.js";
import { logger } from "../utils/logger.js";
import type {
    ApplicationEvent,
    ApplicationEventMap,
  } from "./event-bus.js";

const BATCH_SIZE = 20;
const POLL_INTERVAL_MS = 1000;

let processorRunning = false;

async function processPendingEvents(): Promise<void> {
  const events = await prisma.applicationEvent.findMany({
    where: {
      status: "PENDING",
      OR: [
        { nextAttemptAt: null },
        { nextAttemptAt: { lte: new Date() } },
      ],
    },
    orderBy: {
      createdAt: "asc",
    },
    take: BATCH_SIZE,
  });

  for (const storedEvent of events) {
    const claimed = await prisma.applicationEvent.updateMany({
      where: {
        id: storedEvent.id,
        status: "PENDING",
      },
      data: {
        status: "PROCESSING",
        attempts: {
          increment: 1,
        },
      },
    });

    if (claimed.count !== 1) {
      continue;
    }

    try {
switch (storedEvent.type) {
  case "task.created": {
    const event: ApplicationEvent<"task.created"> = {
      eventId: storedEvent.eventId,
      timestamp: storedEvent.timestamp.toISOString(),
      type: "task.created",
      data: storedEvent.data as ApplicationEventMap["task.created"],
    };

    await eventBus.publish(event);
    break;
  }

  case "task.updated": {
    const event: ApplicationEvent<"task.updated"> = {
      eventId: storedEvent.eventId,
      timestamp: storedEvent.timestamp.toISOString(),
      type: "task.updated",
      data: storedEvent.data as ApplicationEventMap["task.updated"],
    };

    await eventBus.publish(event);
    break;
  }

  case "task.deleted": {
    const event: ApplicationEvent<"task.deleted"> = {
      eventId: storedEvent.eventId,
      timestamp: storedEvent.timestamp.toISOString(),
      type: "task.deleted",
      data: storedEvent.data as ApplicationEventMap["task.deleted"],
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
          lastError: null,
          nextAttemptAt: null,
        },
      });

      logger.info(
        {
          eventId: storedEvent.eventId,
          eventType: storedEvent.type,
        },
        "Outbox event processed",
      );
    } catch (error) {
      logger.error(
        {
          eventId: storedEvent.eventId,
          eventType: storedEvent.type,
          error,
        },
        "Outbox event processing failed",
      );

      await prisma.applicationEvent.update({
        where: {
          id: storedEvent.id,
        },
        data: {
          status: "FAILED",
          lastError:
            error instanceof Error
              ? error.message
              : String(error),
        },
      });
    }
  }
}

export function startOutboxProcessor(): void {
  if (processorRunning) {
    return;
  }

  processorRunning = true;

  logger.info(
    {
      pollIntervalMs: POLL_INTERVAL_MS,
      batchSize: BATCH_SIZE,
    },
    "Outbox processor started",
  );

  const poll = async () => {
    try {
      await processPendingEvents();
    } catch (error) {
      logger.error(
        { error },
        "Outbox processor poll failed",
      );
    } finally {
      setTimeout(() => {
        void poll();
      }, POLL_INTERVAL_MS);
    }
  };

  void poll();
}