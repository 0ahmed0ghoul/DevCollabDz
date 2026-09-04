import type {
  RealtimeEvent,
  RealtimeEventType,
} from "../../../../packages/realtime/src/events.js";
import { projectRoom } from "./project-rooms.js";
import { getSocketServer } from "./socket-server.js";
import { logger } from "../utils/logger.js";

interface DispatchRealtimeEventInput<TData> {
  eventId: string;
  timestamp: string;
  type: RealtimeEventType;
  projectId: string;
  actorId: string;
  data: TData;
}

export function dispatchRealtimeEvent<TData>(
  input: DispatchRealtimeEventInput<TData>,
) {
  const event: RealtimeEvent<
    RealtimeEventType,
    TData
  > = {
    eventId: input.eventId,
    type: input.type,
    timestamp: input.timestamp,
    projectId: input.projectId,
    actorId: input.actorId,
    data: input.data,
  };

  const io = getSocketServer();

  if (!io) {
    logger.warn(
      {
        eventId: event.eventId,
        eventType: event.type,
        projectId: event.projectId,
        actorId: event.actorId,
      },
      "Realtime event could not be dispatched because Socket.IO is unavailable",
    );

    return event;
  }

  io.to(projectRoom(input.projectId)).emit(
    input.type,
    event,
  );

  logger.info(
    {
      eventId: event.eventId,
      eventType: event.type,
      projectId: event.projectId,
      actorId: event.actorId,
    },
    "Realtime event dispatched",
  );

  return event;
}