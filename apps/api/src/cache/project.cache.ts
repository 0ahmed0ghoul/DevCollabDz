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
}

export async function setCachedProjectList(
  organizationId: string,
  projects: unknown,
) {
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
}

export async function invalidateProjectListCache(
  organizationId: string,
) {
  const key =
    projectListCacheKey(
      organizationId,
    );

  await redis.del(key);
}