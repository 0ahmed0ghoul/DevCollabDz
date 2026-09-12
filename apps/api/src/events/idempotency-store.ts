import { Prisma } from "../generated/prisma/client.js";
import { prisma } from "../database/prisma.js";

export async function claimEvent(
  eventId: string,
  consumer: string,
): Promise<boolean> {
  try {
    await prisma.processedEvent.create({
      data: {
        eventId,
        consumer,
      },
    });

    return true;
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return false;
    }

    throw error;
  }
}