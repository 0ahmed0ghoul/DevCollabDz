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

type EventHandler<T> = (event: T) => void | Promise<void>;

class ApplicationEventBus {
  private readonly emitter = new EventEmitter();

  private async executeHandler<T>(
    handler: EventHandler<T>,
    event: T,
    eventName: string | number | symbol,
    eventId: string
  ): Promise<void> {
    for (let attempt = 1; attempt <= MAX_HANDLER_ATTEMPTS; attempt++) {
      try {
        await handler(event);
        return;
      } catch (error) {
        if (attempt === MAX_HANDLER_ATTEMPTS) {
          logger.error(
            {
              eventId,
              eventType: String(eventName),
              attempt,
              error,
            },
            "Application event handler permanently failed"
          );

          return;
        }

        logger.warn(
          {
            eventId,
            eventType: String(eventName),
            attempt,
            nextAttempt: attempt + 1,
            error,
          },
          "Application event handler failed, retrying"
        );

        await sleep(RETRY_DELAY_MS * attempt);
      }
    }
  }

  createMetadata(): ApplicationEventMetadata {
    return {
      eventId: randomUUID(),
      timestamp: new Date().toISOString(),
    };
  }

  on<K extends keyof ApplicationEventMap>(
    eventName: K,
    handler: EventHandler<ApplicationEvent<K>>
  ): void {
    this.emitter.on(eventName, handler);
  }

  off<K extends keyof ApplicationEventMap>(
    eventName: K,
    handler: EventHandler<ApplicationEvent<K>>
  ): void {
    this.emitter.off(eventName, handler);
  }

  async emit<K extends keyof ApplicationEventMap>(
    eventName: K,
    data: ApplicationEventMap[K]
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
    data: ApplicationEventMap[K]
  ): ApplicationEvent<K> {
    return {
      eventId: randomUUID(),
      timestamp: new Date().toISOString(),
      type: eventName,
      data,
    };
  }
  async publish<K extends keyof ApplicationEventMap>(
    event: ApplicationEvent<K>
  ): Promise<void> {
    logger.debug(
      {
        eventId: event.eventId,
        eventType: event.type,
      },
      "Application event published"
    );

    const handlers = this.emitter.listeners(event.type) as EventHandler<
      ApplicationEvent<K>
    >[];

    await Promise.all(
      handlers.map((handler) =>
        this.executeHandler(
          handler,
          event,
          event.type,
          event.eventId,
        ),
      ),
    );
  }
}
const MAX_HANDLER_ATTEMPTS = 3;
const RETRY_DELAY_MS = 250;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export const eventBus = new ApplicationEventBus();
