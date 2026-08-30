import { redis } from "../database/redis.js";

const TASK_LIST_TTL_SECONDS = 30;

export interface TaskListCacheQuery {
  page: number;
  limit: number;
  status?: "BACKLOG" | "TODO" | "IN_PROGRESS" | "REVIEW" | "DONE";
  priority?: "LOW" | "MEDIUM" | "HIGH";
  search?: string;
  sort: "createdAt" | "updatedAt" | "title" | "status" | "priority";
  order: "asc" | "desc";
}

export function taskListCacheKey(projectId: string, query: TaskListCacheQuery) {
  const encodedQuery = Buffer.from(JSON.stringify(query)).toString("base64url");

  return `tasks:project:${projectId}:${encodedQuery}`;
}

export async function getCachedTaskList(
  projectId: string,
  query: TaskListCacheQuery
) {
  try {
    if (!redis.isReady) {
      return null;
    }

    const key = taskListCacheKey(projectId, query);

    const cached = await redis.get(key);

    if (!cached) {
      return null;
    }

    return JSON.parse(cached);
  } catch (error) {
    console.error("Task list cache read failed:", error);

    return null;
  }
}

export async function setCachedTaskList(
  projectId: string,
  query: TaskListCacheQuery,
  data: unknown
) {
  try {
    if (!redis.isReady) {
      return;
    }
    const key = taskListCacheKey(projectId, query);

    await redis.set(key, JSON.stringify(data), {
      EX: TASK_LIST_TTL_SECONDS,
    });
  } catch (error) {
    console.error("Task list cache write failed:", error);
  }
}

export async function invalidateProjectTaskCache(projectId: string) {
  try {
    const pattern = `tasks:project:${projectId}:*`;

    const keys: string[] = [];

    for await (const batch of redis.scanIterator({
      MATCH: pattern,
      COUNT: 100,
    })) {
      keys.push(...batch);
    }

    if (keys.length > 0) {
      await redis.del(keys);
    }
  } catch (error) {
    console.error("Task list cache invalidation failed:", error);
  }
}
