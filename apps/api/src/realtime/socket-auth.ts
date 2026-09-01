import type { Socket } from "socket.io";

import jwt from "jsonwebtoken";
import { logger } from "../utils/logger.js";

interface AccessTokenPayload {
  userId: string;
}

const JWT_SECRET = process.env.JWT_SECRET ?? "";

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined");
}

function isAccessTokenPayload(value: unknown): value is AccessTokenPayload {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return typeof candidate.userId === "string";
}

export function socketAuthMiddleware(
  socket: Socket,
  next: (err?: Error) => void
) {
  logger.info(
    {
      socketId: socket.id,
      hasToken:
        typeof socket.handshake.auth?.token ===
        "string",
    },
    "Socket handshake received",
  );
  logger.info(
    {
      socketId: socket.id,
      hasAuth:
        typeof socket.handshake.auth === "object",
      hasToken:
        typeof socket.handshake.auth?.token ===
        "string",
    },
    "Socket authentication middleware reached",
  );
  try {
    const token = socket.handshake.auth?.token;
    logger.info(
      {
        tokenReceived: typeof token === "string" && token.length > 0,
      },
      "Socket authentication attempt"
    );
    if (typeof token !== "string" || token.length === 0) {
      return next(new Error("Authentication required"));
    }

    const decoded: unknown = jwt.verify(token, JWT_SECRET);

    if (!isAccessTokenPayload(decoded)) {
      return next(new Error("Invalid authentication token"));
    }

    socket.data.userId = decoded.userId;

    return next();
  } catch {
    return next(new Error("Invalid authentication token"));
  }
}
