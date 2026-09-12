import type { Task } from "@prisma/client";

import { eventBus } from "../events/event-bus.js";



import { dispatchRealtimeEvent } from "./realtime-dispatcher.js";
import { claimEvent } from "../events/idempotency-store.js";

const CONSUMER_NAME = "realtime";

export function registerRealtimeEventHandlers(): void {
  console.log("✅ Registering realtime event handlers");

  eventBus.on("task.created", async (event) => {
    if (
      !(await claimEvent(
        event.eventId,
        CONSUMER_NAME,
      ))
    ) {
      return;
    }

    await dispatchRealtimeEvent({
      eventId: event.eventId,
      timestamp: event.timestamp,
      type: "task.created",
      projectId: event.data.projectId,
      actorId: event.data.actorId,
      data: {
        task: event.data.task as Task,
      },
    });

    await claimEvent(
      event.eventId,
      CONSUMER_NAME,
    )
  });

  eventBus.on("task.updated", async (event) => {
    if (
      !(await claimEvent(
        event.eventId,
        CONSUMER_NAME,
      ))
    ) {
      return;
    }

    await dispatchRealtimeEvent({
      eventId: event.eventId,
      timestamp: event.timestamp,
      type: "task.updated",
      projectId: event.data.projectId,
      actorId: event.data.actorId,
      data: {
        task: event.data.task as Task,
      },
    });

    await claimEvent(
      event.eventId,
      CONSUMER_NAME,
    )
  });

  eventBus.on("task.deleted", async (event) => {
    if (
      !(await claimEvent(
        event.eventId,
        CONSUMER_NAME,
      ))
    ) {
      return;
    }

    await dispatchRealtimeEvent({
      eventId: event.eventId,
      timestamp: event.timestamp,
      type: "task.deleted",
      projectId: event.data.projectId,
      actorId: event.data.actorId,
      data: {
        taskId: event.data.taskId,
      },
    });

    await claimEvent(
      event.eventId,
      CONSUMER_NAME,
    )
  });
}