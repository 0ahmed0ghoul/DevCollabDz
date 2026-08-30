let cacheHits = 0;
let cacheMisses = 0;

export function recordCacheHit() {
  cacheHits += 1;
}

export function recordCacheMiss() {
  cacheMisses += 1;
}

export function getCacheMetrics() {
  const total =
    cacheHits + cacheMisses;

  const hitRate =
    total === 0
      ? 0
      : cacheHits / total;

  return {
    hits: cacheHits,
    misses: cacheMisses,
    total,
    hitRate,
  };
}