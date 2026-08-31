import { redis } from "../database/redis.js";

import { cacheGet, cacheSet, cacheDelete } from "./cache-utils.js";

import { taskProjectCachePrefix } from "./cache-keys.js";

import { recordCacheHit, recordCacheMiss } from "./cache-metrics.js";

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
  if (!redis.isReady) {
    return null;
  }
  const cached = await cacheGet(
    () => redis.get(taskListCacheKey(projectId, query)),
    null
  );

  if (cached) {
    recordCacheHit("tasks");
  } else {
    recordCacheMiss("tasks");
  }

  return cached;
  return cacheGet(() => redis.get(taskListCacheKey(projectId, query)), null);
}

export async function setCachedTaskList(
  projectId: string,
  query: TaskListCacheQuery,
  data: unknown
) {
  if (!redis.isReady) {
    return;
  }

  await cacheSet(() =>
    redis.set(taskListCacheKey(projectId, query), JSON.stringify(data), {
      EX: TASK_LIST_TTL_SECONDS,
    })
  );
}

export async function invalidateProjectTaskCache(projectId: string) {
  if (!redis.isReady) {
    return;
  }

  await cacheDelete(async () => {
    const pattern = `${taskProjectCachePrefix(projectId)}*`;

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
  });
}
