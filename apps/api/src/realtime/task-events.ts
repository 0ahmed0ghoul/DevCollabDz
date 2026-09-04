import type { Task } from "@prisma/client";
import { dispatchRealtimeEvent } from "./realtime-dispatcher.js";

export function emitTaskCreated(
  projectId: string,
  actorId: string,
  task: Task,
) {
  return dispatchRealtimeEvent({
    type: "task.created",
    projectId,
    actorId,
    data: { task },
  });
}

export function emitTaskUpdated(
  projectId: string,
  actorId: string,
  task: Task,
) {
  return dispatchRealtimeEvent({
    type: "task.updated",
    projectId,
    actorId,
    data: { task },
  });
}

export function emitTaskDeleted(
  projectId: string,
  actorId: string,
  taskId: string,
) {
  return dispatchRealtimeEvent({
    type: "task.deleted",
    projectId,
    actorId,
    data: { taskId },
  });
}