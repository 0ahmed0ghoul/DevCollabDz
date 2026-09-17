import { Prisma } from "../../generated/prisma/client.js";

import { prisma } from "../../database/prisma.js";

export async function createNotificationIfNew(
  data: {
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
  try {
    const notification =
      await prisma.notification.create({
        data: {
          recipientId: data.recipientId,
          type: data.type,
          title: data.title,
          body: data.body,
          data: data.data,
          sourceEventId: data.sourceEventId,
        },
        select: {
          id: true,
        },
      });

    return {
      created: true,
      notificationId: notification.id,
    };
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return {
        created: false,
      };
    }

    throw error;
  }
}