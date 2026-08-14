import type { Request, Response } from "express";

import {
  createTaskSchema,
  updateTaskSchema,
} from "./task.schema.js";

import {
  createTask,
  getTasks,
  getTask,
  updateTask,
  deleteTask,
} from "./task.service.js";

export async function create(
  req: Request,
  res: Response
) {
  try {
    if (!req.userId) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    const projectId = req.params.projectId as string;

    const result = createTaskSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        message: "Validation failed",
        errors: result.error.flatten(),
      });
    }

    const task = await createTask(
      projectId,
      req.userId,
      result.data
    );

    return res.status(201).json({
      message: "Task created successfully",
      task,
    });
  } catch (error) {
    console.error("Create task error:", error);

    if (
      error instanceof Error &&
      (
        error.message ===
          "You are not a member of this organization" ||
        error.message ===
          "Assignee is not a member of this organization"
      )
    ) {
      return res.status(403).json({
        message: error.message,
      });
    }

    if (
      error instanceof Error &&
      error.message === "Project not found"
    ) {
      return res.status(404).json({
        message: error.message,
      });
    }

    return res.status(500).json({
      message: "Internal server error",
    });
  }
}

export async function getAll(
  req: Request,
  res: Response
) {
  try {
    if (!req.userId) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    const projectId = req.params.projectId as string;

    const tasks = await getTasks(
      projectId,
      req.userId
    );

    return res.status(200).json({
      tasks,
    });
  } catch (error) {
    console.error("Get tasks error:", error);

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
      error.message === "Project not found"
    ) {
      return res.status(404).json({
        message: error.message,
      });
    }

    return res.status(500).json({
      message: "Internal server error",
    });
  }
}

export async function getOne(
  req: Request,
  res: Response
) {
  try {
    if (!req.userId) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

const taskId = req.params.taskId as string;

    const task = await getTask(
      taskId,
      req.userId
    );

    return res.status(200).json({
      task,
    });
  } catch (error) {
    console.error("Get task error:", error);

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
      error.message === "Task not found"
    ) {
      return res.status(404).json({
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
  res: Response
) {
  try {
    if (!req.userId) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    const taskId = req.params.taskId as string;

    const result = updateTaskSchema.safeParse(
      req.body
    );

    if (!result.success) {
      return res.status(400).json({
        message: "Validation failed",
        errors: result.error.flatten(),
      });
    }

    const task = await updateTask(
      taskId,
      req.userId,
      result.data
    );

    return res.status(200).json({
      message: "Task updated successfully",
      task,
    });
  } catch (error) {
    console.error("Update task error:", error);

    if (
      error instanceof Error &&
      (
        error.message ===
          "You are not a member of this organization" ||
        error.message ===
          "Assignee is not a member of this organization"
      )
    ) {
      return res.status(403).json({
        message: error.message,
      });
    }

    if (
      error instanceof Error &&
      error.message === "Task not found"
    ) {
      return res.status(404).json({
        message: error.message,
      });
    }

    return res.status(500).json({
      message: "Internal server error",
    });
  }
}

export async function remove(
  req: Request,
  res: Response
) {
  try {
    if (!req.userId) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    const taskId = req.params.taskId as string;

    await deleteTask(
      taskId,
      req.userId
    );

    return res.status(204).send();
  } catch (error) {
    console.error("Delete task error:", error);

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
      error.message === "Task not found"
    ) {
      return res.status(404).json({
        message: error.message,
      });
    }

    return res.status(500).json({
      message: "Internal server error",
    });
  }
}