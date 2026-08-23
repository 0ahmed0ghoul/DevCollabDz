import { prisma } from "../../database/prisma.js";

import type { CreateTaskInput, UpdateTaskInput } from "./task.schema.js";

async function getProjectMembership(projectId: string, userId: string) {
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
export async function createTask(
  projectId: string,
  userId: string,
  input: CreateTaskInput
) {
  const project = await getProjectMembership(projectId, userId);

  if (input.assigneeId) {
    const assignee = await prisma.organizationMember.findUnique({
      where: {
        userId_organizationId: {
          userId: input.assigneeId,
          organizationId: project.organizationId,
        },
      },
    });

    if (!assignee) {
      throw new Error("Assignee is not a member of this organization");
    }
  }

  const task = await prisma.task.create({
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

  return task;
}
export async function getTasks(projectId: string, userId: string) {
  await getProjectMembership(projectId, userId);

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
    throw new Error("Task not found");
  }

  const membership = await prisma.organizationMember.findUnique({
    where: {
      userId_organizationId: {
        userId,
        organizationId: task.project.organizationId,
      },
    },
  });

  if (!membership) {
    throw new Error("You are not a member of this organization");
  }

  return task;
}
export async function updateTask(
  taskId: string,
  userId: string,
  input: UpdateTaskInput
) {
  const task = await prisma.task.findUnique({
    where: {
      id: taskId,
    },
    include: {
      project: {
        select: {
          organizationId: true,
        },
      },
    },
  });

  if (!task) {
    throw new Error("Task not found");
  }

  const membership = await prisma.organizationMember.findUnique({
    where: {
      userId_organizationId: {
        userId,
        organizationId: task.project.organizationId,
      },
    },
  });

  if (!membership) {
    throw new Error("You are not a member of this organization");
  }

  if (input.assigneeId) {
    const assignee = await prisma.organizationMember.findUnique({
      where: {
        userId_organizationId: {
          userId: input.assigneeId,
          organizationId: task.project.organizationId,
        },
      },
    });

    if (!assignee) {
      throw new Error("Assignee is not a member of this organization");
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
  const task = await prisma.task.findUnique({
    where: {
      id: taskId,
    },
    include: {
      project: {
        select: {
          organizationId: true,
        },
      },
    },
  });

  if (!task) {
    throw new Error("Task not found");
  }

  const membership = await prisma.organizationMember.findUnique({
    where: {
      userId_organizationId: {
        userId,
        organizationId: task.project.organizationId,
      },
    },
  });

  if (!membership) {
    throw new Error("You are not a member of this organization");
  }

  await prisma.task.delete({
    where: {
      id: taskId,
    },
  });
}
