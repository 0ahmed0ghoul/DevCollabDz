import { Router } from "express";

import {
  listNotificationsController,
  unreadNotificationCountController,
} from "./notification.controller.js";
import { authenticate } from "../../middleware/auth.middleware.js";

const router = Router();

router.get(
    "/",
    authenticate,
    listNotificationsController,
  );
  
  router.get(
    "/unread-count",
    authenticate,
    unreadNotificationCountController,
  );
export default router;