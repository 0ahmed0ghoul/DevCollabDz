import {
    Counter,
    Histogram,
    Gauge,
    Registry,
  } from "prom-client";
  

  export const metricsRegistry =
    new Registry();
  
  export const httpRequestsTotal =
    new Counter({
      name: "devcollab_http_requests_total",
      help: "Total number of HTTP requests",
      labelNames: [
        "method",
        "route",
        "status_code",
      ],
      registers: [
        metricsRegistry,
      ],
    });
  
  export const httpRequestDuration =
    new Histogram({
      name: "devcollab_http_request_duration_seconds",
      help: "HTTP request duration in seconds",
      labelNames: [
        "method",
        "route",
        "status_code",
      ],
      buckets: [
        0.005,
        0.01,
        0.025,
        0.05,
        0.1,
        0.25,
        0.5,
        1,
        2,
        5,
      ],
      registers: [
        metricsRegistry,
      ],
    });

    export const databaseQueryDuration =
  new Histogram({
    name: "devcollab_database_query_duration_seconds",
    help: "Prisma database query duration in seconds",
    labelNames: [
      "operation",
    ],
    buckets: [
      0.001,
      0.005,
      0.01,
      0.025,
      0.05,
      0.1,
      0.25,
      0.5,
      1,
      2,
    ],
    registers: [
      metricsRegistry,
    ],
  });

export const redisReady =
  new Gauge({
    name: "devcollab_redis_ready",
    help: "Whether Redis is ready to accept commands",
    registers: [
      metricsRegistry,
    ],
  });