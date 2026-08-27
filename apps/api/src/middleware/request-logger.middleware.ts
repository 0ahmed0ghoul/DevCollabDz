import type { RequestHandler } from "express";

export const requestLoggerMiddleware: RequestHandler =
  (req, res, next) => {
    const startedAt =
      Date.now();

    res.on("finish", () => {
      const duration =
        Date.now() - startedAt;

      console.info({
        type: "api_request",
        requestId:
          res.locals.requestId ??
          "unknown",
        method: req.method,
        path: req.originalUrl,
        statusCode:
          res.statusCode,
        durationMs: duration,
      });
    });

    next();
  };