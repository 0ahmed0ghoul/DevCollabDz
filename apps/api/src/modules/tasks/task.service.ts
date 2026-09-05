import { prisma } from "../../database/prisma.js";

import type { CreateTaskInput, UpdateTaskInput } from "./task.schema.js";

import { ForbiddenError, NotFoundError } from "../../errors/app-error.js";
import {
  getCachedTaskList,
  setCachedTaskList,
  TaskListCacheQuery,
  invalidateProjectTaskCache,
} from "../../cache/task.cache.js";
import { persistApplicationEvent } from "../../events/event-store.js";
import { withCacheLock } from "../../cache/cache-lock.js";
import { eventBus } from "../../events/event-bus.js";
import { logger } from "../../utils/logger.js";

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
  await getProjectAccess(projectId, userId);

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

  const event = eventBus.create("task.created", {
    projectId,
    actorId: userId,
    task: null,
  });
  const metadata = eventBus.createMetadata();
  const task = await prisma.$transaction(async (tx) => {
    const createdTask = await tx.task.create({
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
  
      include: {
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  
    const event = {
      ...metadata,
      type: "task.created" as const,
      data: {
        projectId,
        actorId: userId,
        task: createdTask,
      },
    };
  
    await persistApplicationEvent(
      {
        eventId: event.eventId,
        type: event.type,
        timestamp: new Date(event.timestamp),
        projectId: event.data.projectId,
        actorId: event.data.actorId,
        data: event.data,
      },
      tx,
    );
  
    return {
      task: createdTask,
      event,
    };
  });
  
  await invalidateProjectTaskCache(projectId);
  
  await eventBus.publish(task.event);
  
  return task.task;
}
export async function getTasks(
  projectId: string,
  userId: string,
  page: number,
  limit: number,
  status?: "BACKLOG" | "TODO" | "IN_PROGRESS" | "REVIEW" | "DONE",
  priority?: "LOW" | "MEDIUM" | "HIGH",
  search?: string,
  sort:
    | "createdAt"
    | "updatedAt"
    | "title"
    | "status"
    | "priority" = "createdAt",
  order: "asc" | "desc" = "desc"
) {
  await getProjectAccess(projectId, userId);

  const cacheQuery: TaskListCacheQuery = {
    page,
    limit,
    ...(status !== undefined ? { status } : {}),
    ...(priority !== undefined ? { priority } : {}),
    ...(search ? { search } : {}),
    sort,
    order,
  };

  const cached = await getCachedTaskList(projectId, cacheQuery);

  if (cached) {
    return cached;
  }

  return withCacheLock(
    `tasks:${projectId}:${JSON.stringify(cacheQuery)}`,
    async () => {
      const secondCheck = await getCachedTaskList(projectId, cacheQuery);

      if (secondCheck) {
        return secondCheck;
      }

      const skip = (page - 1) * limit;

      const where = {
        projectId,

        ...(status ? { status } : {}),

        ...(priority ? { priority } : {}),

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
        createdAt: [{ createdAt: order }, { id: order }],
        updatedAt: [{ updatedAt: order }, { id: order }],
        title: [{ title: order }, { id: order }],
        status: [{ status: order }, { id: order }],
        priority: [{ priority: order }, { id: order }],
      };

      const orderBy = orderByMap[sort];

      const [tasks, total] = await Promise.all([
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

      await setCachedTaskList(projectId, cacheQuery, result);

      return result;
    }
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
    const metadata = eventBus.createMetadata();
    const result = await prisma.$transaction(async (tx) => {
      const updatedTask = await tx.task.update({
        where: {
          id: taskId,
        },
    
        data: input,
    
        include: {
          assignee: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });
    
      const event = {
        ...metadata,
        type: "task.updated" as const,
        data: {
          projectId: task.project.id,
          actorId: userId,
          task: updatedTask,
        },
      };
    
      await persistApplicationEvent(
        {
          eventId: event.eventId,
          type: event.type,
          timestamp: new Date(event.timestamp),
          projectId: event.data.projectId,
          actorId: event.data.actorId,
          data: event.data,
        },
        tx,
      );
    
      return {
        task: updatedTask,
        event,
      };
    });
    
    await invalidateProjectTaskCache(task.project.id);
    
    await eventBus.publish(result.event);
    
    return result.task;
}

export async function deleteTask(
  taskId: string,
  userId: string,
) {
  const { task } = await getTaskWithAccess(
    taskId,
    userId,
  );

  const metadata = eventBus.createMetadata();

  const result = await prisma.$transaction(
    async (tx) => {
      await tx.task.delete({
        where: {
          id: taskId,
        },
      });

      const event = {
        ...metadata,
        type: "task.deleted" as const,
        data: {
          projectId: task.project.id,
          actorId: userId,
          taskId,
        },
      };

      await persistApplicationEvent(
        {
          eventId: event.eventId,
          type: event.type,
          timestamp: new Date(event.timestamp),
          projectId: event.data.projectId,
          actorId: event.data.actorId,
          data: event.data,
        },
        tx,
      );

      return event;
    },
  );

  await invalidateProjectTaskCache(
    task.project.id,
  );

  await eventBus.publish(result);
}
