import { prisma } from "../database/prisma.js";

const BATCH_SIZE = 20;

export async function claimPendingEvents() {
  const now = new Date();

  const events = await prisma.applicationEvent.findMany({
    where: {
      status: "PENDING",
      OR: [
        { nextAttemptAt: null },
        { nextAttemptAt: { lte: now } },
      ],
    },
    orderBy: {
      createdAt: "asc",
    },
    take: BATCH_SIZE,
  });

  const claimedEvents = [];

  for (const event of events) {
    const claimed =
      await prisma.applicationEvent.updateMany({
        where: {
          id: event.id,
          status: "PENDING",
        },
        data: {
          status: "PROCESSING",
          processingStartedAt: new Date(),
          attempts: {
            increment: 1,
          },
        },
      });

    if (claimed.count === 1) {
      claimedEvents.push(event);
    }
  }

  return claimedEvents;
}