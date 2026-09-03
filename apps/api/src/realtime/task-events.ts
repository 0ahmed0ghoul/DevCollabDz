import type { Server } from "socket.io";

import type { Task } from "@prisma/client";

import {
  dispatchRealtimeEvent,
} from "./realtime-dispatcher.js";

export function emitTaskCreated(
  io: Server,
  projectId: string,
  actorId: string,
  task: Task,
) {
  return dispatchRealtimeEvent(
    io,
    {
      type: "task.created",
      projectId,
      actorId,
      data: {
        task,
      },
    },
  );
}

export function emitTaskUpdated(
  io: Server,
  projectId: string,
  actorId: string,
  task: Task,
) {
  return dispatchRealtimeEvent(
    io,
    {
      type: "task.updated",
      projectId,
      actorId,
      data: {
        task,
      },
    },
  );
}

export function emitTaskDeleted(
  io: Server,
  projectId: string,
  actorId: string,
  taskId: string,
) {
  return dispatchRealtimeEvent(
    io,
    {
      type: "task.deleted",
      projectId,
      actorId,
      data: {
        taskId,
      },
    },
  );
}