import { prisma } from "../../database/prisma.js";
import { ForbiddenError ,NotFoundError} from "../../errors/app-error.js";
import type {
  CreateProjectInput,
  UpdateProjectInput,
} from "./project.schema.js";

import type { ProjectRole } from "../../generated/prisma/client.js";

export async function createProject(
  organizationId: string,
  userId: string,
  input: CreateProjectInput,
) {
  const membership =
    await prisma.organizationMember.findUnique({
      where: {
        userId_organizationId: {
          userId,
          organizationId,
        },
      },
    });

  if (!membership) {
    throw new ForbiddenError(
      "You are not a member of this organization",
    );
  }

  const project =
    await prisma.$transaction(
      async (tx) => {
        const createdProject =
          await tx.project.create({
            data: {
              name: input.name,
              description:
                input.description,

              organization: {
                connect: {
                  id: organizationId,
                },
              },

              owner: {
                connect: {
                  id: userId,
                },
              },
            },
          });

        await tx.projectMember.create({
          data: {
            projectId:
              createdProject.id,
            userId,
            role: "OWNER",
          },
        });

        return createdProject;
      },
    );

  return project;
}

export async function getProjects(organizationId: string, userId: string) {
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

  return prisma.project.findMany({
    where: {
      organizationId,
    },
    include: {
      owner: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function getProject(
  projectId: string,
  userId: string
) {
  const project = await prisma.project.findUnique({
    where: {
      id: projectId,
    },
    include: {
      organization: true,

      owner: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  if (!project) {
    throw new Error("Project not found");
  }

  const membership =
    await prisma.organizationMember.findUnique({
      where: {
        userId_organizationId: {
          userId,
          organizationId: project.organizationId,
        },
      },
    });

  if (!membership) {
    throw new Error(
      "You are not a member of this organization"
    );
  }

  return project;
}

export async function updateProject(
  projectId: string,
  userId: string,
  input: UpdateProjectInput,
) {
  const project =
    await prisma.project.findUnique({
      where: {
        id: projectId,
      },
    });

  if (!project) {
    throw new Error(
      "Project not found",
    );
  }

  const membership =
    await prisma.organizationMember.findUnique({
      where: {
        userId_organizationId: {
          userId,
          organizationId:
            project.organizationId,
        },
      },
    });

  if (!membership) {
    throw new Error(
      "You are not a member of this organization",
    );
  }

  const canManage =
    project.ownerId === userId ||
    membership.role === "OWNER";

  if (!canManage) {
    throw new Error(
      "You do not have permission to modify this project",
    );
  }

  return prisma.project.update({
    where: {
      id: projectId,
    },
    data: {
      ...(input.name !== undefined
        ? {
            name: input.name,
          }
        : {}),

      ...(input.description !== undefined
        ? {
            description:
              input.description,
          }
        : {}),
    },
    include: {
      owner: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });
}

export async function deleteProject(
  projectId: string,
  userId: string,
) {
  const project =
    await prisma.project.findUnique({
      where: {
        id: projectId,
      },
    });

  if (!project) {
    throw new Error(
      "Project not found",
    );
  }

  const membership =
    await prisma.organizationMember.findUnique({
      where: {
        userId_organizationId: {
          userId,
          organizationId:
            project.organizationId,
        },
      },
    });

  if (!membership) {
    throw new Error(
      "You are not a member of this organization",
    );
  }

  const canManage =
    project.ownerId === userId ||
    membership.role === "OWNER";

  if (!canManage) {
    throw new Error(
      "You do not have permission to modify this project",
    );
  }

  await prisma.project.delete({
    where: {
      id: projectId,
    },
  });
}


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
    });

  if (!projectMembership) {
    throw new ForbiddenError(
      "You are not a member of this project",
    );
  }

  return {
    project,
    organizationMembership,
    projectMembership,
  };
}