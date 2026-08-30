import { prisma } from "../../database/prisma.js";
import { ForbiddenError, NotFoundError } from "../../errors/app-error.js";
import type {
  CreateProjectInput,
  UpdateProjectInput,
} from "./project.schema.js";
import {
  getCachedProjectList,
  invalidateProjectListCache,
  setCachedProjectList,
} from "../../cache/project.cache.js";

import type { ProjectRole } from "../../generated/prisma/client.js";

import {
  withCacheLock,
} from "../../cache/cache-lock.js";


export async function createProject(
  organizationId: string,
  userId: string,
  input: CreateProjectInput
) {
  const membership = await prisma.organizationMember.findUnique({
    where: {
      userId_organizationId: {
        userId,
        organizationId,
      },
    },
    select: {
      role: true,
    },
  });

  if (!membership) {
    throw new ForbiddenError("You are not a member of this organization");
  }

  const project = await prisma.$transaction(async (tx) => {
    const createdProject = await tx.project.create({
      data: {
        name: input.name,
        description: input.description,

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
        projectId: createdProject.id,
        userId,
        role: "OWNER",
      },
    });

    return createdProject;
  });

  await invalidateProjectListCache(
    organizationId,
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
    select: {
      role: true,
    },
  });

  if (!membership) {
    throw new Error("You are not a member of this organization");
  }
  const cached =
  await getCachedProjectList(
    organizationId,
  );

if (cached) {
  return cached;
}

return withCacheLock(
  `projects:${organizationId}`,
  async () => {
    const secondCheck =
      await getCachedProjectList(
        organizationId,
      );

    if (secondCheck) {
      return secondCheck;
    }

    const projects =
      await prisma.project.findMany({
        where: {
          organizationId,
        },

        orderBy: {
          createdAt: "desc",
        },

        select: {
          id: true,
          name: true,
          description: true,
          organizationId: true,
          ownerId: true,
          createdAt: true,
          updatedAt: true,

          members: {
            select: {
              id: true,
              userId: true,
              role: true,

              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },

            orderBy: {
              createdAt: "asc",
            },
          },

          _count: {
            select: {
              tasks: true,
              members: true,
            },
          },
        },
      });

    await setCachedProjectList(
      organizationId,
      projects,
    );

    return projects;
  },
);
}

export async function getProject(projectId: string, userId: string) {
  const project = await prisma.project.findUnique({
    where: {
      id: projectId,
    },
    select: {
      id: true,
      name: true,
      description: true,
      organizationId: true,
      ownerId: true,
      createdAt: true,
      updatedAt: true,

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

  const membership = await prisma.organizationMember.findUnique({
    where: {
      userId_organizationId: {
        userId,
        organizationId: project.organizationId,
      },
    },
  });

  if (!membership) {
    throw new Error("You are not a member of this organization");
  }

  return project;
}

export async function updateProject(
  projectId: string,
  userId: string,
  input: UpdateProjectInput
) {
  const project = await prisma.project.findUnique({
    where: {
      id: projectId,
    },
  });

  if (!project) {
    throw new Error("Project not found");
  }

  const membership = await prisma.organizationMember.findUnique({
    where: {
      userId_organizationId: {
        userId,
        organizationId: project.organizationId,
      },
    },
  });

  if (!membership) {
    throw new Error("You are not a member of this organization");
  }

  const canManage = project.ownerId === userId || membership.role === "OWNER";

  if (!canManage) {
    throw new Error("You do not have permission to modify this project");
  }

  const updatedProject = await prisma.project.update({
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
            description: input.description,
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
  await invalidateProjectListCache(
    project.organizationId,
  );
  

  return updatedProject;
}

export async function deleteProject(projectId: string, userId: string) {
  const project = await prisma.project.findUnique({
    where: {
      id: projectId,
    },
  });

  if (!project) {
    throw new Error("Project not found");
  }

  const membership = await prisma.organizationMember.findUnique({
    where: {
      userId_organizationId: {
        userId,
        organizationId: project.organizationId,
      },
    },
  });

  if (!membership) {
    throw new Error("You are not a member of this organization");
  }

  const canManage = project.ownerId === userId || membership.role === "OWNER";

  if (!canManage) {
    throw new Error("You do not have permission to modify this project");
  }

  await prisma.project.delete({
    where: {
      id: projectId,
    },
  });
  await invalidateProjectListCache(
    project.organizationId,
  );
}

async function getProjectAccess(projectId: string, userId: string) {
  const project = await prisma.project.findUnique({
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
    throw new NotFoundError("Project not found");
  }

  const organizationMembership = await prisma.organizationMember.findUnique({
    where: {
      userId_organizationId: {
        userId,
        organizationId: project.organizationId,
      },
    },
    select: {
      role: true,
    },
  });

  if (!organizationMembership) {
    throw new ForbiddenError("You are not a member of this organization");
  }

  const projectMembership = await prisma.projectMember.findUnique({
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
    throw new ForbiddenError("You are not a member of this project");
  }

  return {
    project,
    organizationMembership,
    projectMembership,
  };
}
