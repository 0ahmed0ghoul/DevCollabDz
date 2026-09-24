import type { Prisma } from "../../generated/prisma/client.js";

import {
  createNotificationIfNew,
  listNotifications,
  countUnreadNotifications,
} from "./notification.store.js";

export async function createNotification(
  input: {
    recipientId: string;
    type:
      | "TASK_ASSIGNED"
      | "TASK_STATUS_CHANGED"
      | "MENTION"
      | "TASK_COMMENT"
      | "PROJECT_MEMBER_ADDED";
    title: string;
    body: string;
    data?: Prisma.InputJsonValue;
    sourceEventId: string;
  },
): Promise<{
  created: boolean;
  notificationId?: string;
}> {
  return createNotificationIfNew({
    recipientId: input.recipientId,
    type: input.type,
    title: input.title,
    body: input.body,
    data: input.data,
    sourceEventId: input.sourceEventId,
  });
}

export async function getNotifications(
  recipientId: string,
  limit?: number,
) {
  return listNotifications(
    recipientId,
    limit,
  );
}

export async function getUnreadNotificationCount(
  recipientId: string,
): Promise<number> {
  return countUnreadNotifications(
    recipientId,
  );
}