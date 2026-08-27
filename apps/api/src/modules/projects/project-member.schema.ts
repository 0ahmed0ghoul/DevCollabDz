import { z } from "zod";

export const addProjectMemberSchema =
  z.object({
    userId: z
      .string()
      .min(1, "User ID is required"),

    role: z
      .enum([
        "ADMIN",
        "MEMBER",
      ])
      .default("MEMBER"),
  });

export const updateProjectMemberRoleSchema =
  z.object({
    role: z.enum([
      "ADMIN",
      "MEMBER",
    ]),
  });

export type AddProjectMemberInput =
  z.infer<
    typeof addProjectMemberSchema
  >;

export type UpdateProjectMemberRoleInput =
  z.infer<
    typeof updateProjectMemberRoleSchema
  >;