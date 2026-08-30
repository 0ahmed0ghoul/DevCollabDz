import { redis } from "../database/redis.js";

const PROJECT_LIST_TTL_SECONDS = 60;

export function projectListCacheKey(
  organizationId: string,
) {
  return `projects:organization:${organizationId}`;
}

export async function getCachedProjectList(
  organizationId: string,
) {
  try {
    if (!redis.isReady) {
      return null;
    }

    const key =
      projectListCacheKey(
        organizationId,
      );

    const cached =
      await redis.get(key);

    if (!cached) {
      return null;
    }

    return JSON.parse(cached);
  } catch (error) {
    console.error(
      "Project cache read failed:",
      error,
    );

    return null;
  }
}

export async function setCachedProjectList(
  organizationId: string,
  projects: unknown,
) {
  try {
    if (!redis.isReady) {
      return;
    }
    const key =
      projectListCacheKey(
        organizationId,
      );

    await redis.set(
      key,
      JSON.stringify(projects),
      {
        EX:
          PROJECT_LIST_TTL_SECONDS,
      },
    );
  } catch (error) {
    console.error(
      "Project cache write failed:",
      error,
    );
  }
}

export async function invalidateProjectListCache(
  organizationId: string,
) {
  try {
    const key =
      projectListCacheKey(
        organizationId,
      );

    await redis.del(key);
  } catch (error) {
    console.error(
      "Project cache invalidation failed:",
      error,
    );
  }
}