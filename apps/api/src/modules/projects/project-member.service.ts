import { prisma } from "../../database/prisma.js";

import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from "../../errors/app-error.js";

import {
  canManageProjectMembers,
  canManageProjectAdmins,
} from "./project.policy.js";

import type {
  AddProjectMemberInput,
  UpdateProjectMemberRoleInput,
} from "./project-member.schema.js";

async function getProjectAccess(
  projectId: string,
  userId: string,
) {
  const project =
    await prisma.project.findUnique({
      where: {
        id: projectId,
      },
      select: {
        id: true,
        organizationId: true,
        ownerId: true,
      },
    });

  if (!project) {
    throw new NotFoundError(
      "Project not found",
    );
  }

  const organizationMembership =
  await prisma.organizationMember.findUnique({
    where: {
      userId_organizationId: {
        userId,
        organizationId:
          project.organizationId,
      },
    },
    select: {
      role: true,
    },
  });

  if (!organizationMembership) {
    throw new ForbiddenError(
      "You are not a member of this organization",
    );
  }

  const projectMembership =
  await prisma.projectMember.findUnique({
    where: {
      projectId_userId: {
        projectId,
        userId,
      },
    },
    select: {
      id: true,
      role: true,
    },
  });

  if (!projectMembership) {
    throw new ForbiddenError(
      "You are not a member of this project",
    );
  }

  return {
    project,
    membership: projectMembership,
  };
}

export async function getProjectMembers(
  projectId: string,
  actorUserId: string,
) {
  await getProjectAccess(
    projectId,
    actorUserId,
  );

  return prisma.projectMember.findMany({
    where: {
      projectId,
    },
    orderBy: [
      {
        role: "asc",
      },
      {
        createdAt: "asc",
      },
    ],
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

export async function addProjectMember(
  projectId: string,
  actorUserId: string,
  input: AddProjectMemberInput,
) {
  const {
    project,
    membership: actorMembership,
  } = await getProjectAccess(
    projectId,
    actorUserId,
  );

  if (
    !canManageProjectMembers(
      actorMembership.role,
    )
  ) {
    throw new ForbiddenError(
      "You do not have permission to manage project members",
    );
  }

  if (
    input.role === "ADMIN" &&
    !canManageProjectAdmins(
      actorMembership.role,
    )
  ) {
    throw new ForbiddenError(
      "You do not have permission to create project admins",
    );
  }

  const user =
    await prisma.user.findUnique({
      where: {
        id: input.userId,
      },
    });

  if (!user) {
    throw new NotFoundError(
      "User not found",
    );
  }

  const organizationMembership =
    await prisma.organizationMember.findUnique({
      where: {
        userId_organizationId: {
          userId: input.userId,
          organizationId:
            project.organizationId,
        },
      },
    });

  if (!organizationMembership) {
    throw new ForbiddenError(
      "User is not a member of this organization",
    );
  }

  const existing =
    await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId:
            input.userId,
        },
      },
    });

  if (existing) {
    throw new ConflictError(
      "User is already a member of this project",
    );
  }

  return prisma.projectMember.create({
    data: {
      projectId,
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

export async function updateProjectMemberRole(
  projectId: string,
  actorUserId: string,
  memberId: string,
  input: UpdateProjectMemberRoleInput,
) {
  const {
    membership: actorMembership,
  } = await getProjectAccess(
    projectId,
    actorUserId,
  );

  if (
    !canManageProjectMembers(
      actorMembership.role,
    )
  ) {
    throw new ForbiddenError(
      "You do not have permission to manage project members",
    );
  }

  const targetMember =
    await prisma.projectMember.findUnique({
      where: {
        id: memberId,
      },
    });

  if (
    !targetMember ||
    targetMember.projectId !==
      projectId
  ) {
    throw new NotFoundError(
      "Project member not found",
    );
  }

  if (
    targetMember.role === "OWNER"
  ) {
    throw new ForbiddenError(
      "The project owner role cannot be changed",
    );
  }

  if (
    input.role === "ADMIN" &&
    !canManageProjectAdmins(
      actorMembership.role,
    )
  ) {
    throw new ForbiddenError(
      "You do not have permission to create project admins",
    );
  }

  if (
    actorMembership.role ===
      "ADMIN" &&
    targetMember.role ===
      "ADMIN"
  ) {
    throw new ForbiddenError(
      "Project admins cannot manage other admins",
    );
  }

  return prisma.projectMember.update({
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

export async function removeProjectMember(
  projectId: string,
  actorUserId: string,
  memberId: string,
) {
  const {
    membership: actorMembership,
  } = await getProjectAccess(
    projectId,
    actorUserId,
  );

  if (
    !canManageProjectMembers(
      actorMembership.role,
    )
  ) {
    throw new ForbiddenError(
      "You do not have permission to manage project members",
    );
  }

  const targetMember =
    await prisma.projectMember.findUnique({
      where: {
        id: memberId,
      },
    });

  if (
    !targetMember ||
    targetMember.projectId !==
      projectId
  ) {
    throw new NotFoundError(
      "Project member not found",
    );
  }

  if (
    targetMember.role === "OWNER"
  ) {
    throw new ForbiddenError(
      "The project owner cannot be removed",
    );
  }

  if (
    actorMembership.role ===
      "ADMIN" &&
    targetMember.role ===
      "ADMIN"
  ) {
    throw new ForbiddenError(
      "Project admins cannot remove other admins",
    );
  }

  await prisma.projectMember.delete({
    where: {
      id: memberId,
    },
  });
}