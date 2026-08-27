import type {
  NextFunction,
  Request,
  Response,
} from "express";

import {
  addMemberSchema,
  createOrganizationSchema,
  updateMemberRoleSchema,
  updateOrganizationSchema,
} from "./organization.schema.js";

import {
  addMember,
  createOrganization,
  getOrganization,
  getOrganizationMembers,
  updateMemberRole as updateMemberRoleService,
  updateOrganization as updateOrganizationService,
  getUserOrganizations,
} from "./organization.service.js";

export async function create(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    if (!req.userId) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    const result =
      createOrganizationSchema.safeParse(
        req.body,
      );

    if (!result.success) {
      return res.status(400).json({
        message: "Validation failed",
        errors:
          result.error.flatten()
            .fieldErrors,
      });
    }

    const organization =
      await createOrganization(
        req.userId,
        result.data,
      );

    return res.status(201).json({
      message:
        "Organization created successfully",
      organization,
    });
  } catch (error) {
    next(error);
  }
}

export async function addOrganizationMember(
  req: Request,
  res: Response,
  next: NextFunction,
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
        req.body,
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
    next(error);
  }
}

export async function get(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    if (!req.userId) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    const organizationId =
      req.params.organizationId as string;

    const organization =
      await getOrganization(
        organizationId,
        req.userId,
      );

    if (!organization) {
      return res.status(404).json({
        message:
          "Organization not found",
      });
    }

    return res.status(200).json({
      organization,
    });
  } catch (error) {
    next(error);
  }
}

export async function getMembers(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    if (!req.userId) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    const organizationId =
      req.params.organizationId as string;

    const members =
      await getOrganizationMembers(
        organizationId,
        req.userId,
      );

    return res.status(200).json({
      members,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateMemberRole(
  req: Request,
  res: Response,
  next: NextFunction,
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

    const result =
      updateMemberRoleSchema.safeParse(
        req.body,
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
      await updateMemberRoleService(
        organizationId,
        req.userId,
        memberId,
        result.data,
      );

    return res.status(200).json({
      message:
        "Member role updated successfully",
      member,
    });
  } catch (error) {
    next(error);
  }
}

export async function update(
  req: Request,
  res: Response,
  next: NextFunction,
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
      updateOrganizationSchema.safeParse(
        req.body,
      );

    if (!result.success) {
      return res.status(400).json({
        message: "Validation failed",
        errors:
          result.error.flatten()
            .fieldErrors,
      });
    }

    const organization =
      await updateOrganizationService(
        organizationId,
        req.userId,
        result.data,
      );

    return res.status(200).json({
      message:
        "Organization updated successfully",
      organization,
    });
  } catch (error) {
    next(error);
  }
}

export async function getMyOrganizations(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    if (!req.userId) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    const organizations =
      await getUserOrganizations(
        req.userId,
      );

    return res.status(200).json({
      organizations,
    });
  } catch (error) {
    next(error);
  }
}