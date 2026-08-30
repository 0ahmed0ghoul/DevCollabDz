export async function cacheGet<T>(
    operation: () => Promise<string | null>,
    fallback: T,
  ): Promise<T> {
    try {
      const value = await operation();
  
      if (value === null) {
        return fallback;
      }
  
      return JSON.parse(value) as T;
    } catch (error) {
      console.error(
        "Cache read failed:",
        error,
      );
  
      return fallback;
    }
  }
  
  export async function cacheSet(
    operation: () => Promise<unknown>,
  ): Promise<void> {
    try {
      await operation();
    } catch (error) {
      console.error(
        "Cache write failed:",
        error,
      );
    }
  }
  
  export async function cacheDelete(
    operation: () => Promise<unknown>,
  ): Promise<void> {
    try {
      await operation();
    } catch (error) {
      console.error(
        "Cache invalidation failed:",
        error,
      );
    }
  }