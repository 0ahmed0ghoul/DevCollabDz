import { createNotification } from "./notification.service.js";

import { eventBus } from "../../events/event-bus.js";

interface TaskNotificationData {
  id: string;
  title: string;
  status: string;
  assigneeId: string | null;
  projectId: string;
}

interface TaskUpdatedEventData {
  projectId: string;
  actorId: string;
  task: TaskNotificationData;
  previous: {
    status: string;
    assigneeId: string | null;
  };
}

export function registerNotificationEventHandlers(): void {
  eventBus.on("task.updated", async (event) => {
    const data =
      event.data as TaskUpdatedEventData;

    const {
      task,
      previous,
      actorId,
      projectId,
    } = data;

    /*
     * 1. Task assignment notification
     */
    if (
      previous.assigneeId !== task.assigneeId &&
      task.assigneeId !== null &&
      task.assigneeId !== actorId
    ) {
      await createNotification({
        recipientId: task.assigneeId,
        type: "TASK_ASSIGNED",
        title: "Task assigned to you",
        body: `You were assigned to "${task.title}".`,
        data: {
          taskId: task.id,
          projectId,
        },
        sourceEventId: event.eventId,
      });
    }

    /*
     * 2. Task status notification
     */
    if (
      previous.status !== task.status &&
      task.assigneeId !== null &&
      task.assigneeId !== actorId
    ) {
      await createNotification({
        recipientId: task.assigneeId,
        type: "TASK_STATUS_CHANGED",
        title: "Task status changed",
        body: `"${task.title}" is now ${task.status}.`,
        data: {
          taskId: task.id,
          projectId,
          previousStatus: previous.status,
          newStatus: task.status,
        },
        sourceEventId: event.eventId,
      });
    }
  });
}