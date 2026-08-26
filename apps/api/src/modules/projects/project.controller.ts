import type { Request, Response } from "express";

import { createProjectSchema } from "./project.schema.js";
import {
  updateProjectSchema,
} from "./project.schema.js";

import {
  createProject,
  getProject,
  getProjects,
  updateProject,
  deleteProject,
} from "./project.service.js";

export async function create(req: Request, res: Response) {
  try {
    if (!req.userId) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    const organizationId =
  req.params.organizationId as string;

    const result = createProjectSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        message: "Validation failed",
        errors: result.error.flatten().fieldErrors,
      });
    }

    const project = await createProject(
      organizationId,
      req.userId,
      result.data
    );

    return res.status(201).json({
      message: "Project created successfully",
      project,
    });
  } catch (error) {
    console.error("Create project error:", error);

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

export async function update(
  req: Request,
  res: Response,
) {
  try {
    if (!req.userId) {
      return res.status(401).json({
        message:
          "Authentication required",
      });
    }

    const projectId =
      req.params.projectId as string;

    const result =
      updateProjectSchema.safeParse(
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

    const project =
      await updateProject(
        projectId,
        req.userId,
        result.data,
      );

    return res.status(200).json({
      message:
        "Project updated successfully",
      project,
    });
  } catch (error) {
    console.error(
      "Update project error:",
      error,
    );

    if (
      error instanceof Error &&
      error.message ===
        "Project not found"
    ) {
      return res.status(404).json({
        message: error.message,
      });
    }

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
        "You do not have permission to modify this project"
    ) {
      return res.status(403).json({
        message: error.message,
      });
    }

    return res.status(500).json({
      message:
        "Internal server error",
    });
  }
}

export async function remove(
  req: Request,
  res: Response,
) {
  try {
    if (!req.userId) {
      return res.status(401).json({
        message:
          "Authentication required",
      });
    }

    const projectId =
      req.params.projectId as string;

    await deleteProject(
      projectId,
      req.userId,
    );

    return res.status(200).json({
      message:
        "Project deleted successfully",
    });
  } catch (error) {
    console.error(
      "Delete project error:",
      error,
    );

    if (
      error instanceof Error &&
      error.message ===
        "Project not found"
    ) {
      return res.status(404).json({
        message: error.message,
      });
    }

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
        "You do not have permission to modify this project"
    ) {
      return res.status(403).json({
        message: error.message,
      });
    }

    return res.status(500).json({
      message:
        "Internal server error",
    });
  }
}


export async function getAll(req: Request, res: Response) {
  try {
    if (!req.userId) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    const { organizationId } = req.params as { organizationId: string };

    const projects = await getProjects(organizationId, req.userId);

    return res.status(200).json({
      projects,
    });
  } catch (error) {
    console.error("Get projects error:", error);

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

export async function getOne(req: Request, res: Response) {
  try {
    if (!req.userId) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    const projectId =
  req.params.projectId as string;

    const project = await getProject(projectId, req.userId);

    return res.status(200).json({
      project,
    });
  } catch (error) {
    console.error("Get project error:", error);

    if (error instanceof Error && error.message === "Project not found") {
      return res.status(404).json({
        message: error.message,
      });
    }

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
