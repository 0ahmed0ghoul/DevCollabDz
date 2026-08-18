import type { NextFunction, Request, Response } from "express";

export function errorMiddleware(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  console.error("Unhandled error:", error);

  if (error instanceof Error) {
    return res.status(500).json({
      message: error.message || "Internal server error",
    });
  }

  return res.status(500).json({
    message: "Internal server error",
  });
}