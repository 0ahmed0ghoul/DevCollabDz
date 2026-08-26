import { z } from "zod";
import { prisma } from "../../database/prisma.js";
import type {
  AddMemberInput,
  CreateOrganizationInput,
  UpdateMemberRoleInput,
  UpdateOrganizationInput,
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

export async function addMember(
  organizationId: string,
  actorUserId: string,
  input: AddMemberInput,
) {
  const actorMembership =
    await getActorMembership(
      organizationId,
      actorUserId,
    );

  if (
    !canManageMembers(
      actorMembership.role,
    )
  ) {
    throw new Error(
      "You do not have permission to manage members",
    );
  }

  if (
    actorMembership.role === "ADMIN" &&
    input.role === "ADMIN"
  ) {
    throw new Error(
      "Admins cannot create other admins",
    );
  }

  const user =
    await prisma.user.findUnique({
      where: {
        id: input.userId,
      },
    });

  if (!user) {
    throw new Error("User not found");
  }

  const existingMember =
    await prisma.organizationMember.findUnique({
      where: {
        userId_organizationId: {
          userId: input.userId,
          organizationId,
        },
      },
    });

  if (existingMember) {
    throw new Error(
      "User is already a member",
    );
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
          userId: true,
          organizationId: true,
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
      userId: true,
      organizationId: true,
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
  actorUserId: string,
  memberId: string,
  input: UpdateMemberRoleInput,
) {
  const actorMembership =
    await getActorMembership(
      organizationId,
      actorUserId,
    );

  if (
    !canManageMembers(
      actorMembership.role,
    )
  ) {
    throw new Error(
      "You do not have permission to manage members",
    );
  }

  const targetMember =
    await prisma.organizationMember.findUnique({
      where: {
        id: memberId,
      },
    });

  if (
    !targetMember ||
    targetMember.organizationId !==
      organizationId
  ) {
    throw new Error("Member not found");
  }

  if (targetMember.role === "OWNER") {
    throw new Error(
      "The organization owner cannot be demoted",
    );
  }

  /*
   * ADMIN cannot modify another ADMIN.
   * OWNER can manage both ADMIN and MEMBER.
   */
  if (
    actorMembership.role === "ADMIN" &&
    targetMember.role === "ADMIN"
  ) {
    throw new Error(
      "Admins cannot manage other admins",
    );
  }

  if (
    actorMembership.role === "ADMIN" &&
    input.role === "ADMIN"
  ) {
    throw new Error(
      "Admins cannot promote members to admin",
    );
  }

  return prisma.organizationMember.update({
    where: {
      id: memberId,
    },
    data: {
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

export async function updateOrganization(
  organizationId: string,
  actorUserId: string,
  input: UpdateOrganizationInput,
) {
  const actorMembership =
    await getActorMembership(
      organizationId,
      actorUserId,
    );

  if (actorMembership.role !== "OWNER") {
    throw new Error(
      "Only the organization owner can update organization settings",
    );
  }

  return prisma.organization.update({
    where: {
      id: organizationId,
    },
    data: {
      name: input.name,
    },
  });
}

export async function getUserOrganizations(userId: string) {
  return prisma.organization.findMany({
    where: {
      members: {
        some: {
          userId,
        },
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  });
}

async function getActorMembership(
  organizationId: string,
  actorUserId: string,
) {
  const membership =
    await prisma.organizationMember.findUnique({
      where: {
        userId_organizationId: {
          userId: actorUserId,
          organizationId,
        },
      },
    });

  if (!membership) {
    throw new Error(
      "You are not a member of this organization",
    );
  }

  return membership;
}

function canManageMembers(
  role: string,
) {
  return (
    role === "OWNER" ||
    role === "ADMIN"
  );
}