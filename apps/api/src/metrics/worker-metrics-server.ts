import http from "node:http";
import { metricsRegistry } from "./metrics.js";
import { logger } from "../utils/logger.js";

export function startWorkerMetricsServer(port: number): http.Server {
  const server = http.createServer(async (req, res) => {
    if (req.url === "/metrics" && req.method === "GET") {
      try {
        res.setHeader("Content-Type", metricsRegistry.contentType);
        res.end(await metricsRegistry.metrics());
      } catch (error) {
        logger.error({ error }, "Failed to render worker metrics");
        res.writeHead(500).end();
      }
      return;
    }

    res.writeHead(404).end();
  });

  server.listen(port, () => {
    logger.info({ port }, "Worker metrics server listening");
  });

  return server;
}