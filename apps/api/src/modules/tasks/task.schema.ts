import { z } from "zod";

export const createTaskSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(200),

  description: z
    .string()
    .max(2000)
    .optional(),

  priority: z
    .enum(["LOW", "MEDIUM", "HIGH"])
    .optional(),

  assigneeId: z
    .string()
    .optional(),
});

export const updateTaskSchema = z.object({
  title: z
    .string()
    .min(1)
    .max(200)
    .optional(),

  description: z
    .string()
    .max(2000)
    .optional(),

  status: z
    .enum(["TODO", "IN_PROGRESS", "DONE"])
    .optional(),

  priority: z
    .enum(["LOW", "MEDIUM", "HIGH"])
    .optional(),

  assigneeId: z
    .string()
    .nullable()
    .optional(),
});

export type CreateTaskInput = z.infer<
  typeof createTaskSchema
>;

export type UpdateTaskInput = z.infer<
  typeof updateTaskSchema
>;