const locks = new Map<string, Promise<unknown>>();

export async function withCacheLock<T>(
  key: string,
  operation: () => Promise<T>,
): Promise<T> {
  const existing =
    locks.get(key);

  if (existing) {
    return existing as Promise<T>;
  }

  const promise =
    operation().finally(() => {
      locks.delete(key);
    });

  locks.set(key, promise);

  return promise;
}