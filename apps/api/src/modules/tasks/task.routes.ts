import { Router } from "express";

import { authenticate } from "../../middleware/auth.middleware.js";

import {
  create,
  getAll,
  getOne,
  update,
  remove,
} from "./task.controller.js";

const router = Router();

router.use(authenticate);

router.post(
  "/projects/:projectId/tasks",
  create
);

router.get(
  "/projects/:projectId/tasks",
  getAll
);

router.get(
  "/tasks/:taskId",
  getOne
);

router.patch(
  "/tasks/:taskId",
  update
);

router.delete(
  "/tasks/:taskId",
  remove
);

export default router;