import "dotenv/config";

import {
  createClient,
} from "redis";
import { logger } from "../utils/logger.js";
import { redisReady } from "../metrics/metrics";

const redisUrl =
  process.env.REDIS_URL;

if (!redisUrl) {
  throw new Error(
    "REDIS_URL is not defined",
  );
}

export const redis =
  createClient({
    url: redisUrl,

    socket: {
      reconnectStrategy: (
        retries,
      ) => {

        return Math.min(
          retries * 1000,
          5000,
        );
      },
    },
  });

  redisReady.set(
    redis.isReady ? 1 : 0,
  );

  redis.on(
    "error",
    (error) => {
      redisReady.set(0);
  
      logger.error(
        {
          err: error,
        },
        "Redis connection error",
      );
    },
  );

redis.on(
  "reconnecting",
  () => {
    logger.info(
      "Redis reconnecting",
    );
  },
);

redis.on(
  "ready",
  () => {
    redisReady.set(1);

    logger.info(
      "Redis ready",
    );
  },
);

redis.on(
  "end",
  () => {
    redisReady.set(0);

    logger.warn(
      "Redis connection closed",
    );
  },
);