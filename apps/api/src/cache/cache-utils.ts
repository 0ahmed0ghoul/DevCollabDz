import { logger } from "../utils/logger.js";

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
      logger.error(
        {
          err: error,
        },
        "Cache read failed",
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
      logger.error(
        {
          err: error,
        },
        "Cache write failed",
      );
    }
  }
  
  export async function cacheDelete(
    operation: () => Promise<unknown>,
  ): Promise<void> {
    try {
      await operation();
    } catch (error) {
      logger.error(
        {
          err: error,
        },
        "Cache invalidation failed",
      );
    }
  }