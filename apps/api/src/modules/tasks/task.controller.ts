import type {
  NextFunction,
  Request,
  Response,
} from "express";

import {
  createTaskSchema,
  updateTaskSchema,
  paginationSchema,
  taskFilterSchema
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
  res: Response,
  next: NextFunction,
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
      createTaskSchema.safeParse(
        req.body,
      );

    if (!result.success) {
      return res.status(400).json({
        message: "Validation failed",
        errors:
          result.error.flatten(),
      });
    }

    const task =
      await createTask(
        projectId,
        req.userId,
        result.data,
      );

    return res.status(201).json({
      message:
        "Task created successfully",
      task,
    });
  } catch (error) {
    next(error);
  }
}

export async function getAll(
  req: Request,
  res: Response,
  next: NextFunction,
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

      const filters =
      taskFilterSchema.safeParse(
        req.query,
      );
    
    if (!filters.success) {
      return res.status(400).json({
        message:
          "Invalid task query parameters",
        code: "VALIDATION_ERROR",
        errors:
          filters.error.flatten(),
      });
    }
    
    const {
      page,
      limit,
      status,
      priority,
      search,
      sort,
      order
    } = filters.data;

    const result =
    await getTasks(
      projectId,
      req.userId,
      page,
      limit,
      status,
      priority,
      search,
      sort,
      order
    );
    return res.status(200).json({
      tasks: result.tasks,

      pagination: {
        page,
        limit,
        total: result.total,
        totalPages: Math.ceil(
          result.total / limit,
        ),
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getOne(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    if (!req.userId) {
      return res.status(401).json({
        message:
          "Authentication required",
      });
    }

    const taskId =
      req.params.taskId as string;

    const task =
      await getTask(
        taskId,
        req.userId,
      );

    return res.status(200).json({
      task,
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
        message:
          "Authentication required",
      });
    }

    const taskId =
      req.params.taskId as string;

    const result =
      updateTaskSchema.safeParse(
        req.body,
      );

    if (!result.success) {
      return res.status(400).json({
        message: "Validation failed",
        errors:
          result.error.flatten(),
      });
    }

    const task =
      await updateTask(
        taskId,
        req.userId,
        result.data,
      );

    return res.status(200).json({
      message:
        "Task updated successfully",
      task,
    });
  } catch (error) {
    next(error);
  }
}

export async function remove(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    if (!req.userId) {
      return res.status(401).json({
        message:
          "Authentication required",
      });
    }

    const taskId =
      req.params.taskId as string;

    await deleteTask(
      taskId,
      req.userId,
    );

    return res.status(204).send();
  } catch (error) {
    next(error);
  }
}