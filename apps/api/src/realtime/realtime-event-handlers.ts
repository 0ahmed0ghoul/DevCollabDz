import type { Task } from "@prisma/client";
import { eventBus } from "../events/event-bus.js";
import { dispatchRealtimeEvent } from "./realtime-dispatcher.js";

export function registerRealtimeEventHandlers(): void {
  console.log("✅ Registering realtime event handlers");

  eventBus.on("task.created", (event) => {
    dispatchRealtimeEvent({
      eventId: event.eventId,
      timestamp: event.timestamp,
      type: "task.created",
      projectId: event.data.projectId,
      actorId: event.data.actorId,
      data: {
        task: event.data.task as Task,
      },
    });
  });

  eventBus.on("task.updated", (event) => {
    dispatchRealtimeEvent({
      eventId: event.eventId,
      timestamp: event.timestamp,
      type: "task.updated",
      projectId: event.data.projectId,
      actorId: event.data.actorId,
      data: {
        task: event.data.task as Task,
      },
    });
  });

  eventBus.on("task.deleted", (event) => {
    dispatchRealtimeEvent({
      eventId: event.eventId,
      timestamp: event.timestamp,
      type: "task.deleted",
      projectId: event.data.projectId,
      actorId: event.data.actorId,
      data: {
        taskId: event.data.taskId,
      },
    });
  });
}