import type {
  ErrorRequestHandler,
} from "express";

import { Prisma } from "../generated/prisma/client.js";
import { AppError } from "../errors/app-error.js";

export const errorHandler: ErrorRequestHandler =
  (
    error,
    req,
    res,
    _next,
  ) => {
    const requestId =
      res.locals.requestId ??
      "unknown";

    console.error({
      type: "api_error",
      requestId,
      method: req.method,
      path: req.originalUrl,
      error,
    });

    if (
      error instanceof AppError
    ) {
      return res.status(
        error.statusCode,
      ).json({
        message: error.message,
        code: error.code,
        requestId,
      });
    }

    if (
      error instanceof
      Prisma.PrismaClientKnownRequestError
    ) {
      switch (error.code) {
        case "P2002":
          return res.status(409).json({
            message:
              "A record with the same unique value already exists.",
            code: "CONFLICT",
            requestId,
          });

        case "P2025":
          return res.status(404).json({
            message:
              "The requested record was not found.",
            code: "NOT_FOUND",
            requestId,
          });

        default:
          break;
      }
    }

    return res.status(500).json({
      message:
        "Internal server error",
      code:
        "INTERNAL_SERVER_ERROR",
      requestId,
    });
  };