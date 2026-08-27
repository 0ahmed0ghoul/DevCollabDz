import { Prisma } from "../generated/prisma/client.js";

import {
  ConflictError,
  NotFoundError,
} from "./app-error.js";

export function handlePrismaError(
  error: unknown,
): never {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError
  ) {
    switch (error.code) {
      case "P2002":
        throw new ConflictError(
          "A record with the same unique value already exists.",
        );

      case "P2025":
        throw new NotFoundError(
          "The requested record was not found.",
        );

      default:
        break;
    }
  }

  throw error;
}