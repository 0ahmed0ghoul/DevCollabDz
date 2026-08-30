import { redis } from "../database/redis.js";

import {
  cacheGet,
  cacheSet,
  cacheDelete,
} from "./cache-utils.js";

import {
  projectListCacheKey,
} from "./cache-keys.js";

import {
  recordCacheHit,
  recordCacheMiss,
} from "./cache-metrics.js";


const PROJECT_LIST_TTL_SECONDS = 60;

export async function getCachedProjectList(
  organizationId: string,
) {
  if (!redis.isReady) {
    return null;
  }
  const cached = await cacheGet(
    () =>
      redis.get(
        projectListCacheKey(
          organizationId,
        ),
      ),
    null,
  );
  
  if (cached) {
    recordCacheHit();
  } else {
    recordCacheMiss();
  }
  
  return cached;
  return cacheGet(
    () =>
      redis.get(
        projectListCacheKey(
          organizationId,
        ),
      ),
    null,
  );
}

export async function setCachedProjectList(
  organizationId: string,
  projects: unknown,
) {
  if (!redis.isReady) {
    return;
  }

  await cacheSet(() =>
    redis.set(
      projectListCacheKey(
        organizationId,
      ),
      JSON.stringify(projects),
      {
        EX:
          PROJECT_LIST_TTL_SECONDS,
      },
    ),
  );
}

export async function invalidateProjectListCache(
  organizationId: string,
) {
  if (!redis.isReady) {
    return;
  }

  await cacheDelete(() =>
    redis.del(
      projectListCacheKey(
        organizationId,
      ),
    ),
  );
}