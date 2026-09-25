import type { Server } from "socket.io";

import { redis } from "../../database/redis.js";
import { logger } from "../../utils/logger.js";

const NOTIFICATION_CHANNEL =
  "devcollab:notifications";

export interface NotificationRealtimePayload {
  notificationId: string;
  recipientId: string;
  type:
    | "TASK_ASSIGNED"
    | "TASK_STATUS_CHANGED"
    | "MENTION"
    | "TASK_COMMENT"
    | "PROJECT_MEMBER_ADDED";
  title: string;
  body: string;
  data: Record<string, unknown> | null;
  sourceEventId: string;
  createdAt: string;
}

function getUserRoom(
  userId: string,
): string {
  return `user:${userId}`;
}

export async function publishNotificationCreated(
  payload: NotificationRealtimePayload,
): Promise<void> {
  if (!redis.isReady) {
    throw new Error(
      "Redis is not ready for notification publishing",
    );
  }

  await redis.publish(
    NOTIFICATION_CHANNEL,
    JSON.stringify(payload),
  );

  logger.debug(
    {
      notificationId:
        payload.notificationId,
      recipientId:
        payload.recipientId,
      channel:
        NOTIFICATION_CHANNEL,
    },
    "Notification published to Redis",
  );
}

export async function startNotificationSubscriber(
  io: Server,
): Promise<() => Promise<void>> {
  const subscriber = redis.duplicate();

  subscriber.on(
    "error",
    (error) => {
      logger.error(
        {
          err: error,
          channel:
            NOTIFICATION_CHANNEL,
        },
        "Notification Redis subscriber error",
      );
    },
  );

  subscriber.on(
    "reconnecting",
    () => {
      logger.info(
        "Notification Redis subscriber reconnecting",
      );
    },
  );

  subscriber.on(
    "ready",
    () => {
      logger.info(
        "Notification Redis subscriber ready",
      );
    },
  );

  try {
    await subscriber.connect();

    await subscriber.subscribe(
      NOTIFICATION_CHANNEL,
      (message) => {
        try {
          const payload =
            JSON.parse(
              message,
            ) as NotificationRealtimePayload;

          io.to(
            getUserRoom(
              payload.recipientId,
            ),
          ).emit(
            "notification.created",
            payload,
          );

          logger.debug(
            {
              notificationId:
                payload.notificationId,
              recipientId:
                payload.recipientId,
            },
            "Notification delivered through Socket.IO",
          );
        } catch (error) {
          logger.error(
            {
              error,
            },
            "Failed to process notification Redis message",
          );
        }
      },
    );

    logger.info(
      {
        channel:
          NOTIFICATION_CHANNEL,
      },
      "Notification Redis subscriber started",
    );
  } catch (error) {
    logger.error(
      {
        error,
      },
      "Failed to start notification Redis subscriber",
    );

    await subscriber.quit().catch(
      () => undefined,
    );
  }

  return async () => {
    if (!subscriber.isOpen) {
      return;
    }

    await subscriber
      .unsubscribe(
        NOTIFICATION_CHANNEL,
      )
      .catch(() => undefined);

    await subscriber
      .quit()
      .catch(() => undefined);

    logger.info(
      {
        channel:
          NOTIFICATION_CHANNEL,
      },
      "Notification Redis subscriber stopped",
    );
  };
}