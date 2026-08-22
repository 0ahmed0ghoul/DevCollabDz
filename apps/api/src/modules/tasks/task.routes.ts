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


router.post(
  "/projects/:projectId/tasks",authenticate,
  create
);

router.get(
  "/projects/:projectId/tasks",authenticate,
  getAll
);

router.get(
  "/tasks/:taskId",authenticate,
  getOne
);

router.patch(
  "/tasks/:taskId",authenticate,
  update
);

router.delete(
  "/tasks/:taskId",authenticate,
  remove
);

export default router;