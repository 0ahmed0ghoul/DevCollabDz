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

export interface TaskCreatedData<TTask = unknown> {
  task: TTask;
}

export interface TaskUpdatedData<TTask = unknown> {
  task: TTask;
}

export interface TaskDeletedData {
  taskId: string;
}

export type TaskCreatedEvent<
  TTask = unknown,
> = RealtimeEvent<
  "task.created",
  TaskCreatedData<TTask>
>;

export type TaskUpdatedEvent<
  TTask = unknown,
> = RealtimeEvent<
  "task.updated",
  TaskUpdatedData<TTask>
>;

export type TaskDeletedEvent =
  RealtimeEvent<
    "task.deleted",
    TaskDeletedData
  >;