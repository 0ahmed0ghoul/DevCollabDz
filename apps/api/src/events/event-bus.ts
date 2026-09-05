import { EventEmitter } from "node:events";
import { randomUUID } from "node:crypto";
import { logger } from "../utils/logger.js";
import { persistApplicationEvent } from "./event-store.js";
export interface ApplicationEventMetadata {
  eventId: string;
  timestamp: string;
}

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

export type ApplicationEvent<K extends keyof ApplicationEventMap> =
  ApplicationEventMetadata & {
    type: K;
    data: ApplicationEventMap[K];
  };

type EventHandler<T> = (
  event: T,
) => void | Promise<void>;

class ApplicationEventBus {
  private readonly emitter = new EventEmitter();

  createMetadata(): ApplicationEventMetadata {
    return {
      eventId: randomUUID(),
      timestamp: new Date().toISOString(),
    };
  }
  
  on<K extends keyof ApplicationEventMap>(
    eventName: K,
    handler: EventHandler<ApplicationEvent<K>>,
  ): void {
    this.emitter.on(eventName, handler);
  }

  off<K extends keyof ApplicationEventMap>(
    eventName: K,
    handler: EventHandler<ApplicationEvent<K>>,
  ): void {
    this.emitter.off(eventName, handler);
  }

  async emit<K extends keyof ApplicationEventMap>(
    eventName: K,
    data: ApplicationEventMap[K],
  ): Promise<void> {
    const event = this.create(eventName, data);
  
    await persistApplicationEvent({
      eventId: event.eventId,
      type: event.type,
      timestamp: new Date(event.timestamp),
      projectId: event.data.projectId,
      actorId: event.data.actorId,
      data: event.data,
    });
  
    await this.publish(event);
  }

  create<K extends keyof ApplicationEventMap>(
    eventName: K,
    data: ApplicationEventMap[K],
  ): ApplicationEvent<K> {
    return {
      eventId: randomUUID(),
      timestamp: new Date().toISOString(),
      type: eventName,
      data,
    };
  }
  async publish<K extends keyof ApplicationEventMap>(
    event: ApplicationEvent<K>,
  ): Promise<void> {
    logger.debug(
      {
        eventId: event.eventId,
        eventType: event.type,
      },
      "Application event published",
    );
  
    const handlers = this.emitter
      .listeners(event.type) as EventHandler<
      ApplicationEvent<K>
    >[];
  
    const results = await Promise.allSettled(
      handlers.map((handler) => handler(event)),
    );
  
    for (const result of results) {
      if (result.status === "rejected") {
        logger.error(
          {
            eventId: event.eventId,
            eventType: event.type,
            error: result.reason,
          },
          "Application event handler failed",
        );
      }
    }
  }
}

export const eventBus = new ApplicationEventBus();