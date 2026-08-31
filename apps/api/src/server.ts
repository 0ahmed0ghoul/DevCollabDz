import "dotenv/config";

import app from "./app.js";
import { redis } from "./database/redis.js";
import { logger } from "./utils/logger.js";
const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    try {
      await redis.connect();

      logger.info("Redis connected");
    } catch (error) {
      logger.warn(
        {
          err: error,
        },
        "Redis unavailable. Starting without cache.",
      );
    }

    app.listen(
      PORT,
      () => {
        logger.info(
          {
            port: PORT,
          },
          "DevCollab API running",
        );
      },
    );
  } catch (error) {
    logger.fatal(
      {
        err: error,
      },
      "Failed to start server",
    );

    process.exit(1);
  }
}

void startServer();