import { z } from "zod";

export const createProjectSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Project name must be at least 2 characters")
    .max(100, "Project name must be at most 100 characters"),

  description: z
    .string()
    .trim()
    .max(2000, "Project description must be at most 2000 characters")
    .optional(),
});

export const updateProjectSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Project name must be at least 2 characters")
      .max(100, "Project name must be at most 100 characters")
      .optional(),

    description: z
      .string()
      .trim()
      .max(2000, "Project description must be at most 2000 characters")
      .nullable()
      .optional(),
  })
  .refine(
    (data) =>
      data.name !== undefined ||
      data.description !== undefined,
    {
      message: "At least one field must be provided",
    },
  );

export type CreateProjectInput =
  z.infer<typeof createProjectSchema>;

export type UpdateProjectInput =
  z.infer<typeof updateProjectSchema>;