import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../generated/prisma/client.js";
import { logger } from "../utils/logger.js";
import { databaseQueryDuration } from "../metrics/metrics.js";

const connectionString =
  process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "DATABASE_URL is not defined",
  );
}

const adapter =
  new PrismaPg({
    connectionString,
  });

export const prisma =
  new PrismaClient({
    adapter,
    log: [
      {
        emit: "event",
        level: "query",
      },
      "warn",
      "error",
    ],
  });

  prisma.$on(
    "query",
    (event) => {
      databaseQueryDuration.observe(
        {
          operation:
            "prisma_query",
        },
        event.duration / 1000,
      );
  
      logger.debug(
        {
          type: "database_query",
          durationMs:
            event.duration,
        },
        "Prisma query",
      );
    },
  );