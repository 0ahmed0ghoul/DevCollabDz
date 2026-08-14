import { z } from "zod";
import { prisma } from "../../database/prisma.js";
import type {
  AddMemberInput,
  CreateOrganizationInput,
  UpdateMemberRoleInput,
} from "./organization.schema.js";

export async function createOrganization(
  userId: string,
  input: CreateOrganizationInput
) {
  const organization = await prisma.organization.create({
    data: {
      name: input.name,

      members: {
        create: {
          userId,
          role: "OWNER",
        },
      },
    },

    include: {
      members: {
        select: {
          id: true,
          role: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
    },
  });

  return organization;
}

export const createOrganizationSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Organization name must be at least 2 characters")
    .max(100, "Organization name must be at most 100 characters"),
});

export const addMemberSchema = z.object({
  userId: z.string().min(1, "User ID is required"),

  role: z.enum(["ADMIN", "MEMBER"]).default("MEMBER"),
});

export async function addMember(organizationId: string, input: AddMemberInput) {
  const organization = await prisma.organization.findUnique({
    where: {
      id: organizationId,
    },
  });

  if (!organization) {
    throw new Error("Organization not found");
  }

  const user = await prisma.user.findUnique({
    where: {
      id: input.userId,
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  const existingMember = await prisma.organizationMember.findUnique({
    where: {
      userId_organizationId: {
        userId: input.userId,
        organizationId,
      },
    },
  });

  if (existingMember) {
    throw new Error("User is already a member");
  }

  return prisma.organizationMember.create({
    data: {
      organizationId,
      userId: input.userId,
      role: input.role,
    },

    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });
}
export async function getOrganization(organizationId: string, userId: string) {
  const membership = await prisma.organizationMember.findUnique({
    where: {
      userId_organizationId: {
        userId,
        organizationId,
      },
    },
  });

  if (!membership) {
    throw new Error("You are not a member of this organization");
  }

  return prisma.organization.findUnique({
    where: {
      id: organizationId,
    },

    include: {
      members: {
        select: {
          id: true,
          role: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
    },
  });
}

export async function getOrganizationMembers(
  organizationId: string,
  userId: string
) {
  const membership = await prisma.organizationMember.findUnique({
    where: {
      userId_organizationId: {
        userId,
        organizationId,
      },
    },
  });

  if (!membership) {
    throw new Error("You are not a member of this organization");
  }

  return prisma.organizationMember.findMany({
    where: {
      organizationId,
    },
    select: {
      id: true,
      role: true,
      createdAt: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });
}

export async function updateMemberRole(
  organizationId: string,
  memberId: string,
  input: UpdateMemberRoleInput
) {
  const member = await prisma.organizationMember.findUnique({
    where: {
      id: memberId,
    },
  });

  if (!member || member.organizationId !== organizationId) {
    throw new Error("Member not found");
  }

  if (member.role === "OWNER") {
    throw new Error("The organization owner cannot be demoted");
  }

  return prisma.organizationMember.update({
    where: {
      id: memberId,
    },
    data: {
      role: input.role,
    },
  });
}