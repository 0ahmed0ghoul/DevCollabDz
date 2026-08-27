import { randomUUID } from "node:crypto";
import type { RequestHandler } from "express";

export const requestIdMiddleware: RequestHandler =
  (req, res, next) => {
    const incomingId =
      req.header("x-request-id");

    const requestId =
      incomingId?.trim() || randomUUID();

    res.setHeader(
      "x-request-id",
      requestId,
    );

    res.locals.requestId = requestId;

    next();
  };