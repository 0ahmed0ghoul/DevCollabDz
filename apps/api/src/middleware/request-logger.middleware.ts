import type { RequestHandler } from "express";

import { logger } from "../utils/logger.js";
import { httpRequestDuration, httpRequestsTotal } from "../metrics/metrics.js";

export const requestLoggerMiddleware: RequestHandler =
  (req, res, next) => {
    const startedAt = Date.now();

    res.on("finish", () => {
      const durationMs =
        Date.now() - startedAt;
        const durationSeconds =
        (Date.now() - startedAt) /
        1000;
      
        const route =
        req.route?.path ??
        req.path ??
        "unknown";
      
      httpRequestsTotal.inc({
        method: req.method,
        route,
        status_code:
          String(res.statusCode),
      });
      
      httpRequestDuration.observe(
        {
          method: req.method,
          route,
          status_code:
            String(res.statusCode),
        },
        durationSeconds,
      );

      logger.info(
        {
          type: "api_request",
          requestId:
            res.locals.requestId ??
            "unknown",
          method: req.method,
          path: req.originalUrl,
          statusCode:
            res.statusCode,
          durationMs,
        },
        "API request",
      );
    });

    next();
  };