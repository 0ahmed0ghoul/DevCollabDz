import { logger } from "../utils/logger.js";
import { eventBus } from "./event-bus.js";

export function registerAuditEventHandlers(): void {
  eventBus.on("task.created", (event) => {
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
  });

  eventBus.on("task.updated", (event) => {
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
  });

  eventBus.on("task.deleted", (event) => {
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
  });
}