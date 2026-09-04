import type { Task } from "@prisma/client";
import { eventBus } from "../events/event-bus.js";
import { dispatchRealtimeEvent } from "./realtime-dispatcher.js";

export function registerRealtimeEventHandlers(): void {
    console.log("✅ Registering realtime event handlers");
    eventBus.on("task.created", (event) => {
        console.log("🔥 HANDLER RECEIVED task.created", {
          projectId: event.projectId,
          actorId: event.actorId,
          taskId: (event.task as Task).id,
        });
      
        dispatchRealtimeEvent({
      type: "task.created",
      projectId: event.projectId,
      actorId: event.actorId,
      data: {
        task: event.task as Task,
      },
    });
  });

  eventBus.on("task.updated", (event) => {
    dispatchRealtimeEvent({
      type: "task.updated",
      projectId: event.projectId,
      actorId: event.actorId,
      data: {
        task: event.task as Task,
      },
    });
  });

  eventBus.on("task.deleted", (event) => {
    dispatchRealtimeEvent({
      type: "task.deleted",
      projectId: event.projectId,
      actorId: event.actorId,
      data: {
        taskId: event.taskId,
      },
    });
  });
}