import "dotenv/config";

import { logger } from "./utils/logger.js";
import {
  startOutboxProcessor,
  stopOutboxProcessor,
} from "./events/outbox-processor.js";

startOutboxProcessor();

const shutdown = (signal: string) => {
  logger.info(
    { signal },
    "Worker shutdown signal received",
  );

  stopOutboxProcessor();

  setTimeout(() => {
    logger.info("Worker stopped");
    process.exit(0);
  }, 100);
};

process.on("SIGINT", () => {
  shutdown("SIGINT");
});

process.on("SIGTERM", () => {
  shutdown("SIGTERM");
});