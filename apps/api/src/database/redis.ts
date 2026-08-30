import "dotenv/config";

import {
  createClient,
} from "redis";

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

redis.on(
  "error",
  (error) => {
    console.error(
      "⚠️ Redis connection error:",
      error.message,
    );
  },
);

redis.on(
  "reconnecting",
  () => {
    console.log(
      "🔄 Redis reconnecting...",
    );
  },
);

redis.on(
  "ready",
  () => {
    console.log(
      "✅ Redis ready",
    );
  },
);