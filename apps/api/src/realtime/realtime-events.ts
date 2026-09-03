import type { Task } from "@prisma/client";

export type RealtimeEventType =
  | "task.created"
  | "task.updated"
  | "task.deleted";

export interface RealtimeEvent<
  TType extends RealtimeEventType,
  TData,
> {
  eventId: string;
  type: TType;
  timestamp: string;
  projectId: string;
  actorId: string;
  data: TData;
}

export interface TaskCreatedData {
  task: Task;
}

export interface TaskUpdatedData {
  task: Task;
}

export interface TaskDeletedData {
  taskId: string;
}

export type TaskCreatedEvent =
  RealtimeEvent<
    "task.created",
    TaskCreatedData
  >;

export type TaskUpdatedEvent =
  RealtimeEvent<
    "task.updated",
    TaskUpdatedData
  >;

export type TaskDeletedEvent =
  RealtimeEvent<
    "task.deleted",
    TaskDeletedData
  >;