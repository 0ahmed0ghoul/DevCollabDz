import { logger } from "../utils/logger.js";

import { eventBus } from "./event-bus.js";
import { claimEvent } from "./idempotency-store.js";


const CONSUMER_NAME = "audit";

export function registerAuditEventHandlers(): void {
  eventBus.on("task.created", async (event) => {
    if (
      !(await claimEvent(
        event.eventId,
        CONSUMER_NAME,
      ))
    ) {
      return;
    }

    logger.info(
      {
        eventId: event.eventId,
        eventType: event.type,
        timestamp: event.timestamp,
        projectId: event.data.projectId,
        actorId: event.data.actorId,
        taskId: (event.data.task as { id: string }).id,
      },
      "Audit event: task created",
    );

await claimEvent(
        event.eventId,
        CONSUMER_NAME,
      )
  });

  eventBus.on("task.updated", async (event) => {
    if (
      !(await claimEvent(
        event.eventId,
        CONSUMER_NAME,
      ))
    ) {
      return;
    }

    logger.info(
      {
        eventId: event.eventId,
        eventType: event.type,
        timestamp: event.timestamp,
        projectId: event.data.projectId,
        actorId: event.data.actorId,
        taskId: (event.data.task as { id: string }).id,
      },
      "Audit event: task updated",
    );

    await claimEvent(
      event.eventId,
      CONSUMER_NAME,
    )
  });

  eventBus.on("task.deleted", async (event) => {
    if (
      !(await claimEvent(
        event.eventId,
        CONSUMER_NAME,
      ))
    ) {
      return;
    }

    logger.info(
      {
        eventId: event.eventId,
        eventType: event.type,
        timestamp: event.timestamp,
        projectId: event.data.projectId,
        actorId: event.data.actorId,
        taskId: event.data.taskId,
      },
      "Audit event: task deleted",
    );

    await claimEvent(
      event.eventId,
      CONSUMER_NAME,
    )
  });
}