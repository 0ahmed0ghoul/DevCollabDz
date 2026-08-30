import { prisma } from "../../database/prisma.js";

import type { CreateTaskInput, UpdateTaskInput } from "./task.schema.js";

import { ForbiddenError, NotFoundError } from "../../errors/app-error.js";
import { getCachedTaskList, setCachedTaskList, TaskListCacheQuery,invalidateProjectTaskCache } from "../../cache/task.cache.js";

import {
  withCacheLock,
} from "../../cache/cache-lock.js";

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
  
  await invalidateProjectTaskCache(
    projectId,
  );
  
  return task;
  await invalidateProjectTaskCache(
    projectId,
  );
  return task;
}

export async function getTasks(
  projectId: string,
  userId: string,
  page: number,
  limit: number,
  status?:
    | "BACKLOG"
    | "TODO"
    | "IN_PROGRESS"
    | "REVIEW"
    | "DONE",
  priority?:
    | "LOW"
    | "MEDIUM"
    | "HIGH",
  search?: string,
  sort:
    | "createdAt"
    | "updatedAt"
    | "title"
    | "status"
    | "priority" = "createdAt",
  order: "asc" | "desc" = "desc",
) {
  await getProjectAccess(
    projectId,
    userId,
  );

  const cacheQuery: TaskListCacheQuery = {
    page,
    limit,
    ...(status !== undefined
      ? { status }
      : {}),
    ...(priority !== undefined
      ? { priority }
      : {}),
    ...(search
      ? { search }
      : {}),
    sort,
    order,
  };

  const cached =
    await getCachedTaskList(
      projectId,
      cacheQuery,
    );

  if (cached) {
    return cached;
  }

  return withCacheLock(
    `tasks:${projectId}:${JSON.stringify(cacheQuery)}`,
    async () => {
      const secondCheck =
        await getCachedTaskList(
          projectId,
          cacheQuery,
        );

      if (secondCheck) {
        return secondCheck;
      }

      const skip =
        (page - 1) * limit;

      const where = {
        projectId,

        ...(status
          ? { status }
          : {}),

        ...(priority
          ? { priority }
          : {}),

        ...(search
          ? {
              OR: [
                {
                  title: {
                    contains: search,
                    mode: "insensitive" as const,
                  },
                },
                {
                  description: {
                    contains: search,
                    mode: "insensitive" as const,
                  },
                },
              ],
            }
          : {}),
      };

      const orderByMap = {
        createdAt: [
          { createdAt: order },
          { id: order },
        ],
        updatedAt: [
          { updatedAt: order },
          { id: order },
        ],
        title: [
          { title: order },
          { id: order },
        ],
        status: [
          { status: order },
          { id: order },
        ],
        priority: [
          { priority: order },
          { id: order },
        ],
      };

      const orderBy =
        orderByMap[sort];

      const [tasks, total] =
        await Promise.all([
          prisma.task.findMany({
            where,

            include: {
              assignee: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },

            orderBy,
            skip,
            take: limit,
          }),

          prisma.task.count({
            where,
          }),
        ]);

      const result = {
        tasks,
        total,
      };

      await setCachedTaskList(
        projectId,
        cacheQuery,
        result,
      );

      return result;
    },
  );
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

  const updatedTask =
    await prisma.task.update({
    where: {
      id: taskId,
    },
    data: input,
  });


await invalidateProjectTaskCache(
  task.project.id,
);

return updatedTask;
}

export async function deleteTask(taskId: string, userId: string) {
  const { task } =
  await getTaskWithAccess(
    taskId,
    userId,
  );

await prisma.task.delete({
  where: {
    id: taskId,
  },
});

await invalidateProjectTaskCache(
  task.project.id,
);
}
