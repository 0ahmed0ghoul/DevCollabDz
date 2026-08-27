import { Router } from "express";

import { authenticate } from "../../middleware/auth.middleware.js";

import {
  create,
  getAll,
  getOne,
  remove,
  update,
} from "./project.controller.js";
import {
  getMembers,
  addMember,
  updateMemberRole,
  removeMember,
} from "./project-member.controller.js";

const router = Router();

router.post(
  "/organizations/:organizationId/projects",
  authenticate,
  create
);

router.patch(
  "/projects/:projectId",
  authenticate,
  update,
);

router.delete(
  "/projects/:projectId",
  authenticate,
  remove,
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

router.get(
  "/projects/:projectId/members",
  authenticate,
  getMembers,
);

router.post(
  "/projects/:projectId/members",
  authenticate,
  addMember,
);

router.patch(
  "/projects/:projectId/members/:memberId/role",
  authenticate,
  updateMemberRole,
);

router.delete(
  "/projects/:projectId/members/:memberId",
  authenticate,
  removeMember,
);

export default router;