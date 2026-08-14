import { Router } from "express";

import { authenticate } from "../../middleware/auth.middleware.js";

import {
  create,
  getAll,
  getOne,
} from "./project.controller.js";

const router = Router();

router.post(
  "/organizations/:organizationId/projects",
  authenticate,
  create
);

router.get(
  "/organizations/:organizationId/projects",
  authenticate,
  getAll
);

router.get(
  "/projects/:projectId",
  authenticate,
  getOne
);

export default router;