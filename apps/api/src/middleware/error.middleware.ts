import type {
  ErrorRequestHandler,
} from "express";

import { Prisma } from "../generated/prisma/client.js";
import { AppError } from "../errors/app-error.js";
import { logger } from "../utils/logger.js";

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

    if (
      error instanceof AppError
    ) {
      logger.warn(
        {
          type: "api_error",
          requestId,
          method: req.method,
          path: req.originalUrl,
          statusCode:
            error.statusCode,
          code: error.code,
          err: error,
        },
        "Application error",
      );

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
      logger.error(
        {
          type: "api_error",
          requestId,
          method: req.method,
          path: req.originalUrl,
          statusCode:
            error.code === "P2002"
              ? 409
              : error.code === "P2025"
                ? 404
                : 500,
          prismaCode:
            error.code,
          err: error,
        },
        "Prisma error",
      );

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

    logger.error(
      {
        type: "api_error",
        requestId,
        method: req.method,
        path: req.originalUrl,
        statusCode: 500,
        err: error,
      },
      "Unhandled server error",
    );

    return res.status(500).json({
      message:
        "Internal server error",
      code:
        "INTERNAL_SERVER_ERROR",
      requestId,
    });
  };