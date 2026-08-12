import { Router } from "express";

import { authenticate } from "../../middleware/auth.middleware.js";
import { requireRole } from "../../middleware/role.middleware.js";

import {
  addOrganizationMember,
  create,
  get,
  getMembers,
} from "./organization.controller.js";
import { updateMemberRole } from "./organization.service.js";

const router = Router();

router.use(authenticate);

router.post("/", create);

router.get("/:organizationId", get);

router.post("/:organizationId/members",requireRole("OWNER", "ADMIN"),addOrganizationMember
);
router.get("/:organizationId/members",getMembers);

router.patch("/:organizationId/members/:memberId/role",requireRole("OWNER"),updateMemberRole);

export default router;