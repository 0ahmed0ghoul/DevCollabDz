import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined");
}

const jwtSecret: string = JWT_SECRET;

interface JwtPayload {
  userId: string;
}

export function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const authorization = req.headers.authorization;

  if (!authorization) {
    return res.status(401).json({
      message: "Authentication required",
    });
  }

  const [scheme, token] = authorization.split(" ");

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({
      message: "Invalid authorization format",
    });
  }

  try {
    const payload =
    jwt.verify(token, jwtSecret) as unknown as JwtPayload;
    
    if (!payload.userId) {
      return res.status(401).json({
        message: "Invalid token",
      });
    }

    req.userId = payload.userId;

    next();
  } catch {
    return res.status(401).json({
      message: "Invalid or expired token",
    });
  }
}