import type { Prisma } from "../generated/prisma/client.js";
import { prisma } from "../database/prisma.js";

export interface PersistApplicationEventInput {
  eventId: string;
  type: string;
  timestamp: Date;
  projectId?: string;
  actorId?: string;
  data: unknown;
}

type PrismaTransactionClient = Prisma.TransactionClient;

export async function persistApplicationEvent(
  event: PersistApplicationEventInput,
  client: PrismaTransactionClient = prisma,
) {
  return client.applicationEvent.create({
    data: {
      eventId: event.eventId,
      type: event.type,
      timestamp: event.timestamp,
      projectId: event.projectId,
      actorId: event.actorId,
      data: event.data as Prisma.InputJsonValue,
    },
  });
}