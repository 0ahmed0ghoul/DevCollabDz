import { z } from "zod";

export const TASK_STATUSES = [
  "BACKLOG",
  "TODO",
  "IN_PROGRESS",
  "REVIEW",
  "DONE",
] as const;

export const TASK_PRIORITIES = [
  "LOW",
  "MEDIUM",
  "HIGH",
] as const;

export const createTaskSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Title is required")
    .max(200, "Title must be at most 200 characters"),

  description: z
    .string()
    .trim()
    .max(2000, "Description must be at most 2000 characters")
    .optional(),

  status: z
    .enum(TASK_STATUSES)
    .default("TODO"),

  priority: z
    .enum(TASK_PRIORITIES)
    .default("MEDIUM"),

  assigneeId: z
    .string()
    .min(1)
    .optional(),
});

export const updateTaskSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Title is required")
    .max(200, "Title must be at most 200 characters")
    .optional(),

  description: z
    .string()
    .trim()
    .max(2000, "Description must be at most 2000 characters")
    .optional(),

  status: z
    .enum(TASK_STATUSES)
    .optional(),

  priority: z
    .enum(TASK_PRIORITIES)
    .optional(),

  assigneeId: z
    .string()
    .min(1)
    .nullable()
    .optional(),
});

export type CreateTaskInput = z.infer<
  typeof createTaskSchema
>;

export type UpdateTaskInput = z.infer<
  typeof updateTaskSchema
>;

export type TaskStatus =
  (typeof TASK_STATUSES)[number];

export type TaskPriority =
  (typeof TASK_PRIORITIES)[number];