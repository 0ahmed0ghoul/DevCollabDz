import { createNotificationIfNew } from "./notification.store.js";

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
    data?: Record<string, unknown>;
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
    data: input.data as
      | Record<string, unknown>
      | undefined,
    sourceEventId: input.sourceEventId,
  });
}