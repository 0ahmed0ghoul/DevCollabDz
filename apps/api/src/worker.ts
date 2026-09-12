import "dotenv/config";

import { logger } from "./utils/logger.js";
import { startWorkerMetricsServer } from "./metrics/worker-metrics-server.js";
import {
  startOutboxProcessor,
  stopOutboxProcessor,
} from "./events/outbox-processor.js";

const METRICS_PORT = Number(process.env.WORKER_METRICS_PORT ?? 9465);

const metricsServer = startWorkerMetricsServer(METRICS_PORT);

startOutboxProcessor();

logger.info("Outbox worker process started");

const shutdown = (signal: string) => {
  logger.info({ signal }, "Worker shutdown signal received");

  stopOutboxProcessor();
  metricsServer.close();

  setTimeout(() => {
    logger.info("Worker stopped");
    process.exit(0);
  }, 100);
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));