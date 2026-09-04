import { EventEmitter } from "node:events";

export interface ApplicationEventMap {
  "task.created": {
    projectId: string;
    actorId: string;
    task: unknown;
  };

  "task.updated": {
    projectId: string;
    actorId: string;
    task: unknown;
  };

  "task.deleted": {
    projectId: string;
    actorId: string;
    taskId: string;
  };
}

type EventHandler<T> = (event: T) => void | Promise<void>;

class ApplicationEventBus {
  private readonly emitter = new EventEmitter();

  on<K extends keyof ApplicationEventMap>(
    eventName: K,
    handler: EventHandler<ApplicationEventMap[K]>,
  ): void {
    this.emitter.on(eventName, handler);
  }

  off<K extends keyof ApplicationEventMap>(
    eventName: K,
    handler: EventHandler<ApplicationEventMap[K]>,
  ): void {
    this.emitter.off(eventName, handler);
  }

  emit<K extends keyof ApplicationEventMap>(
    eventName: K,
    event: ApplicationEventMap[K],
  ): void {
    this.emitter.emit(eventName, event);
  }
}

export const eventBus = new ApplicationEventBus();