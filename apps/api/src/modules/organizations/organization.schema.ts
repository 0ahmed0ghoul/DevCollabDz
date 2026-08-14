import { z } from "zod";

export const createOrganizationSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Organization name must be at least 2 characters")
    .max(100, "Organization name must be at most 100 characters"),
});
export const updateMemberRoleSchema = z.object({
  role: z.enum(["ADMIN", "MEMBER"]),
});

export type UpdateMemberRoleInput = z.infer<
  typeof updateMemberRoleSchema
>;
  
export const addMemberSchema = z.object({
  userId: z.string().min(1, "User ID is required"),

  role: z
    .enum(["ADMIN", "MEMBER"])
    .default("MEMBER"),
});

export type CreateOrganizationInput = z.infer<
  typeof createOrganizationSchema
>;

export type AddMemberInput = z.infer<
  typeof addMemberSchema
>;