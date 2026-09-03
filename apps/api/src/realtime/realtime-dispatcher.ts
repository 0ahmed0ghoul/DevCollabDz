import {
    randomUUID,
  } from "node:crypto";
  
  import type { Server } from "socket.io";
  
  import {
    projectRoom,
  } from "./project-rooms.js";
  
  import type {
    RealtimeEvent,
    RealtimeEventType,
  } from "../../../../packages/realtime/src/events";
  
  import { logger } from "../utils/logger.js";
  
  interface DispatchRealtimeEventInput<
    TData,
  > {
    type: RealtimeEventType;
    projectId: string;
    actorId: string;
    data: TData;
  }
  
  export function dispatchRealtimeEvent<
    TData,
  >(
    io: Server,
    input: DispatchRealtimeEventInput<TData>,
  ) {
    const event: RealtimeEvent<
      RealtimeEventType,
      TData
    > = {
      eventId: randomUUID(),
      type: input.type,
      timestamp:
        new Date().toISOString(),
      projectId: input.projectId,
      actorId: input.actorId,
      data: input.data,
    };
  
    io.to(
      projectRoom(
        input.projectId,
      ),
    ).emit(
      input.type,
      event,
    );
  
    logger.info(
      {
        eventId: event.eventId,
        eventType: event.type,
        projectId:
          event.projectId,
        actorId:
          event.actorId,
      },
      "Realtime event dispatched",
    );
  
    return event;
  }