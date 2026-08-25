import type { Request, Response } from "express";

import {
  addMemberSchema,
  createOrganizationSchema,
  updateMemberRoleSchema,
} from "./organization.schema.js";

import {
  addMember,
  createOrganization,
  getOrganization,
  getOrganizationMembers,
  updateMemberRole as updateMemberRoleService,
  getUserOrganizations,
} from "./organization.service.js";

export async function create(req: Request, res: Response) {
  try {
    if (!req.userId) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    const result = createOrganizationSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        message: "Validation failed",
        errors: result.error.flatten().fieldErrors,
      });
    }

    const organization = await createOrganization(req.userId, result.data);

    return res.status(201).json({
      message: "Organization created successfully",
      organization,
    });
  } catch (error) {
    console.error("Create organization error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
}

export async function addOrganizationMember(
  req: Request,
  res: Response
) {
  try {
    if (!req.userId) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    const organizationId =
      req.params.organizationId as string;

    const result =
      addMemberSchema.safeParse(
        req.body
      );

    if (!result.success) {
      return res.status(400).json({
        message: "Validation failed",
        errors:
          result.error.flatten()
            .fieldErrors,
      });
    }

    const member =
      await addMember(
        organizationId,
        req.userId,
        result.data,
      );

    return res.status(201).json({
      message:
        "Member added successfully",
      member,
    });
  } catch (error) {
    console.error(
      "Add member error:",
      error,
    );

    if (
      error instanceof Error &&
      error.message ===
        "You are not a member of this organization"
    ) {
      return res.status(403).json({
        message: error.message,
      });
    }

    if (
      error instanceof Error &&
      error.message ===
        "You do not have permission to manage members"
    ) {
      return res.status(403).json({
        message: error.message,
      });
    }

    if (
      error instanceof Error &&
      error.message ===
        "Admins cannot create other admins"
    ) {
      return res.status(403).json({
        message: error.message,
      });
    }

    if (
      error instanceof Error &&
      error.message ===
        "Organization not found"
    ) {
      return res.status(404).json({
        message: error.message,
      });
    }

    if (
      error instanceof Error &&
      error.message ===
        "User not found"
    ) {
      return res.status(404).json({
        message: error.message,
      });
    }

    if (
      error instanceof Error &&
      error.message ===
        "User is already a member"
    ) {
      return res.status(409).json({
        message: error.message,
      });
    }

    return res.status(500).json({
      message:
        "Internal server error",
    });
  }
}

export async function get(req: Request, res: Response) {
  try {
    if (!req.userId) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    const organizationId =
  req.params.organizationId as string;

    const organization = await getOrganization(
      organizationId,
      req.userId
    );

    if (!organization) {
      return res.status(404).json({
        message: "Organization not found",
      });
    }

    return res.status(200).json({
      organization,
    });
  } catch (error) {
    console.error("Get organization error:", error);

    if (
      error instanceof Error &&
      error.message === "You are not a member of this organization"
    ) {
      return res.status(403).json({
        message: error.message,
      });
    }

    return res.status(500).json({
      message: "Internal server error",
    });
  }
}

export async function getMembers(
  req: Request,
  res: Response
) {
  try {
    if (!req.userId) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    const organizationId =
  req.params.organizationId as string;

    const members = await getOrganizationMembers(
      organizationId,
      req.userId
    );

    return res.status(200).json({
      members,
    });
  } catch (error) {
    console.error("Get organization members error:", error);

    if (
      error instanceof Error &&
      error.message === "You are not a member of this organization"
    ) {
      return res.status(403).json({
        message: error.message,
      });
    }

    return res.status(500).json({
      message: "Internal server error",
    });
  }
}

export async function updateMemberRole(
  req: Request,
  res: Response
) {
  try {
    if (!req.userId) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    const organizationId =
      req.params.organizationId as string;

    const memberId =
      req.params.memberId as string;

      const result = updateMemberRoleSchema.safeParse(req.body);      
    if (!result.success) {
      return res.status(400).json({
        message: "Validation failed",
        errors: result.error.flatten().fieldErrors,
      });
    }

const member =
  await updateMemberRoleService(
    organizationId,
    req.userId,
    memberId,
    result.data,
  );
    return res.status(200).json({
      message: "Member role updated successfully",
      member,
    });
  } catch (error) {
    console.error("Update member role error:", error);
    if (
      error instanceof Error &&
      error.message ===
        "You do not have permission to manage members"
    ) {
      return res.status(403).json({
        message: error.message,
      });
    }
    
    if (
      error instanceof Error &&
      error.message ===
        "Admins cannot create other admins"
    ) {
      return res.status(403).json({
        message: error.message,
      });
    }
    
    if (
      error instanceof Error &&
      error.message ===
        "Admins cannot manage other admins"
    ) {
      return res.status(403).json({
        message: error.message,
      });
    }
    
    if (
      error instanceof Error &&
      error.message ===
        "Admins cannot promote members to admin"
    ) {
      return res.status(403).json({
        message: error.message,
      });
    }
    if (
      error instanceof Error &&
      error.message === "Member not found"
    ) {
      return res.status(404).json({
        message: error.message,
      });
    }

    if (
      error instanceof Error &&
      error.message ===
        "The organization owner cannot be demoted"
    ) {
      return res.status(400).json({
        message: error.message,
      });
    }

    return res.status(500).json({
      message: "Internal server error",
    });
  }
}

export async function getMyOrganizations(
  req: Request,
  res: Response
) {
  try {
    if (!req.userId) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    const organizations = await getUserOrganizations(req.userId);

    return res.status(200).json({
      organizations,
    });
  } catch (error) {
    console.error("Get user organizations error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
}
