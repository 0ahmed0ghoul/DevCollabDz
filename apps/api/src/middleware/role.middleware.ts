import type { NextFunction, Request, Response } from "express";
import { prisma } from "../database/prisma.js";
import { logger } from "../utils/logger.js";

type OrganizationRole = "OWNER" | "ADMIN" | "MEMBER";

const roleHierarchy: Record<OrganizationRole, number> = {
  OWNER: 3,
  ADMIN: 2,
  MEMBER: 1,
};

export function requireRole(
  ...allowedRoles: OrganizationRole[]
) {
  return async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      if (!req.userId) {
        return res.status(401).json({
          message: "Authentication required",
        });
      }

      const organizationId =
      req.params.organizationId as string;

      if (!organizationId) {
        return res.status(400).json({
          message: "Organization ID is required",
        });
      }

      const membership =
        await prisma.organizationMember.findUnique({
          where: {
            userId_organizationId: {
              userId: req.userId,
              organizationId,
            },
          },
          select: {
            role: true,
          },
        });

      if (!membership) {
        return res.status(403).json({
          message: "You are not a member of this organization",
        });
      }

      const userRole =
        membership.role as OrganizationRole;

      const hasPermission = allowedRoles.includes(userRole);

      if (!hasPermission) {
        return res.status(403).json({
          message: "You do not have permission to perform this action",
        });
      }

      next();
    } catch (error) {
      logger.error(
        {
          type: "authorization_error",
          requestId:
            res.locals.requestId ??
            "unknown",
          method: req.method,
          path: req.originalUrl,
          err: error,
        },
        "Role authorization error",
      );
      return res.status(500).json({
        message: "Internal server error",
      });
    }
  };
}