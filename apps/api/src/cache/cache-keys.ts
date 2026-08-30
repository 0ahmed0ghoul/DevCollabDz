export function projectListCacheKey(
    organizationId: string,
  ) {
    return `projects:organization:${organizationId}`;
  }
  
  export function taskProjectCachePrefix(
    projectId: string,
  ) {
    return `tasks:project:${projectId}:`;
  }