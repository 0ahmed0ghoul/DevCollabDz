import { prisma } from "../../database/prisma.js";
import type { CreateProjectInput } from "./project.schema.js";

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