import { prisma } from "../../database/prisma.js";
import type {
  CreateProjectInput,
  UpdateProjectInput,
} from "./project.schema.js";

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
  });

  if (!membership) {
    throw new Error("You are not a member of this organization");
  }

  const project = await prisma.project.create({
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