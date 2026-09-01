import type { Server } from "socket.io";

import { logger } from "../utils/logger.js";
import { projectRoom } from "./project-rooms.js";

export interface TaskCreatedEvent {
  task: unknown;
}

export interface TaskUpdatedEvent {
  task: unknown;
}

export interface TaskDeletedEvent {
  taskId: string;
  projectId: string;
}

export function emitTaskCreated(
  io: Server,
  projectId: string,
  task: unknown,
) {
  io.to(projectRoom(projectId)).emit(
    "task:created",
    {
      task,
    } satisfies TaskCreatedEvent,
  );

  logger.info(
    {
      projectId,
      event: "task:created",
    },
    "Task event emitted",
  );
}

export function emitTaskUpdated(
  io: Server,
  projectId: string,
  task: unknown,
) {
  io.to(projectRoom(projectId)).emit(
    "task:updated",
    {
      task,
    } satisfies TaskUpdatedEvent,
  );

  logger.info(
    {
      projectId,
      event: "task:updated",
    },
    "Task event emitted",
  );
}

export function emitTaskDeleted(
  io: Server,
  projectId: string,
  taskId: string,
) {
  io.to(projectRoom(projectId)).emit(
    "task:deleted",
    {
      taskId,
      projectId,
    } satisfies TaskDeletedEvent,
  );

  logger.info(
    {
      projectId,
      taskId,
      event: "task:deleted",
    },
    "Task event emitted",
  );
}