import type { Request, Response } from "express";

export function getCurrentUser(req: Request, res: Response) {
  return res.status(200).json({
    message: "You are authenticated",
    userId: req.userId,
  });
}