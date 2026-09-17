import { prisma } from "../database/prisma.js";
import { logger } from "../utils/logger.js";

import {
  applicationEventsReplayedTotal,
} from "../metrics/metrics.js";

import { eventBus } from "./event-bus.js";

import type {
  ApplicationEvent,
  ApplicationEventMap,
} from "./event-bus.js";

export async function replayApplicationEvent(
  eventId: string,
): Promise<void> {
  const storedEvent =
    await prisma.applicationEvent.findUnique({
      where: {
        eventId,
      },
    });

  if (!storedEvent) {
    throw new Error(
      `Application event not found: ${eventId}`,
    );
  }

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

  applicationEventsReplayedTotal.inc({
    event_type: storedEvent.type,
  });

  logger.info(
    {
      eventId: storedEvent.eventId,
      eventType: storedEvent.type,
    },
    "Application event replayed",
  );
}

export async function replayApplicationEvents(
  options: {
    from?: Date;
    to?: Date;
    type?: string;
    limit?: number;
  } = {},
): Promise<number> {
  const events =
    await prisma.applicationEvent.findMany({
      where: {
        createdAt: {
          ...(options.from
            ? { gte: options.from }
            : {}),
          ...(options.to
            ? { lte: options.to }
            : {}),
        },
        ...(options.type
          ? { type: options.type }
          : {}),
      },
      orderBy: {
        createdAt: "asc",
      },
      take: options.limit ?? 100,
    });

  for (const event of events) {
    await replayApplicationEvent(event.eventId);
  }

  logger.info(
    {
      replayedEvents: events.length,
      from: options.from,
      to: options.to,
      eventType: options.type,
    },
    "Application event batch replay completed",
  );

  return events.length;
}