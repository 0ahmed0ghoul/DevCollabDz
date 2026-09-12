import "dotenv/config";

import { prisma } from "../database/prisma.js";
import { claimEvent } from "./idempotency-store.js";

const eventId = `test-${Date.now()}`;
const consumer = "idempotency-test";

async function main() {
  const results = await Promise.all([
    claimEvent(eventId, consumer),
    claimEvent(eventId, consumer),
    claimEvent(eventId, consumer),
  ]);

  console.log("Claim results:", results);

  const record = await prisma.processedEvent.findUnique({
    where: {
      eventId_consumer: {
        eventId,
        consumer,
      },
    },
  });

  console.log("Stored record:", record);

  await prisma.processedEvent.delete({
    where: {
      eventId_consumer: {
        eventId,
        consumer,
      },
    },
  });

  await prisma.$disconnect();
}

void main();