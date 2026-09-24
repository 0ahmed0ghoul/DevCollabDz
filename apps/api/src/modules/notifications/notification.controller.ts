import type { Request, Response } from "express";

import {
  getNotifications,
  getUnreadNotificationCount,
} from "./notification.service.js";

export async function listNotificationsController(
  req: Request,
  res: Response,
) {
  const userId = req.userId;

  if (!userId) {
    return res.status(401).json({ message: "Authentication required" });
  }

  const rawLimit = Number(req.query.limit ?? 20);
  const limit = Number.isFinite(rawLimit) ? rawLimit : 20;

  const notifications = await getNotifications(userId, limit);

  return res.json({ notifications });
}

export async function unreadNotificationCountController(
  req: Request,
  res: Response,
) {
  const userId = req.userId;

  if (!userId) {
    return res.status(401).json({ message: "Authentication required" });
  }

  const count = await getUnreadNotificationCount(userId);

  return res.json({ count });
}