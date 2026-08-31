import { Counter } from "prom-client";
import { metricsRegistry } from "../metrics/metrics";

let cacheHits = 0;
let cacheMisses = 0;

export function recordCacheHit(
  cache = "unknown",
) {
  cacheHits += 1;

  cacheHitsTotal.inc({
    cache,
  });
}

export function recordCacheMiss(
  cache = "unknown",
) {
  cacheMisses += 1;

  cacheMissesTotal.inc({
    cache,
  });
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

export const cacheHitsTotal =
  new Counter({
    name: "devcollab_cache_hits_total",
    help: "Total cache hits",
    labelNames: [
      "cache",
    ],
    registers: [
      metricsRegistry,
    ],
  });

export const cacheMissesTotal =
  new Counter({
    name: "devcollab_cache_misses_total",
    help: "Total cache misses",
    labelNames: [
      "cache",
    ],
    registers: [
      metricsRegistry,
    ],
  });