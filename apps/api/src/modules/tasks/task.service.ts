import { prisma } from "../../database/prisma.js";

import type { CreateTaskInput, UpdateTaskInput } from "./task.schema.js";

import { ForbiddenError, NotFoundError } from "../../errors/app-error.js";

async function getProjectAccess(projectId: string, userId: string) {
  const project = await prisma.project.findUnique({
    where: {
      id: projectId,
    },
    select: {
      id: true,
      organizationId: true,
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

async function getTaskWithAccess(taskId: string, userId: string) {
  const task = await prisma.task.findUnique({
    where: {
      id: taskId,
    },
    include: {
      project: {
        select: {
          id: true,
          organizationId: true,
          name: true,
        },
      },

      assignee: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  if (!task) {
    throw new NotFoundError("Task not found");
  }

  const organizationMembership = await prisma.organizationMember.findUnique({
    where: {
      userId_organizationId: {
        userId,
        organizationId: task.project.organizationId,
      },
    },
  });

  if (!organizationMembership) {
    throw new ForbiddenError("You are not a member of this organization");
  }

  const projectMembership = await prisma.projectMember.findUnique({
    where: {
      projectId_userId: {
        projectId: task.project.id,
        userId,
      },
    },
  });

  if (!projectMembership) {
    throw new ForbiddenError("You are not a member of this project");
  }

  return {
    task,
    organizationMembership,
    projectMembership,
  };
}

export async function createTask(
  projectId: string,
  userId: string,
  input: CreateTaskInput
) {
  const { project } = await getProjectAccess(projectId, userId);

  if (input.assigneeId) {
    const assignee = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId: input.assigneeId,
        },
      },
    });

    if (!assignee) {
      throw new ForbiddenError("Assignee is not a member of this project");
    }
  }

  return prisma.task.create({
    data: {
      title: input.title,
      description: input.description,
      status: input.status ?? "TODO",
      priority: input.priority ?? "MEDIUM",

      project: {
        connect: {
          id: projectId,
        },
      },

      ...(input.assigneeId
        ? {
            assignee: {
              connect: {
                id: input.assigneeId,
              },
            },
          }
        : {}),
    },
  });
}

export async function getTasks(projectId: string, userId: string) {
  await getProjectAccess(projectId, userId);

  return prisma.task.findMany({
    where: {
      projectId,
    },
    include: {
      assignee: {
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

export async function getTask(taskId: string, userId: string) {
  const { task } = await getTaskWithAccess(taskId, userId);

  return task;
}

export async function updateTask(
  taskId: string,
  userId: string,
  input: UpdateTaskInput
) {
  const { task } = await getTaskWithAccess(taskId, userId);

  if (input.assigneeId !== undefined && input.assigneeId !== null) {
    const assignee = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId: task.project.id,
          userId: input.assigneeId,
        },
      },
    });

    if (!assignee) {
      throw new ForbiddenError("Assignee is not a member of this project");
    }
  }

  return prisma.task.update({
    where: {
      id: taskId,
    },
    data: input,
  });
}

export async function deleteTask(taskId: string, userId: string) {
  await getTaskWithAccess(taskId, userId);
  await prisma.task.delete({
    where: {
      id: taskId,
    },
  });
}
