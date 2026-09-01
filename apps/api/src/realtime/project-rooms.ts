import type { Server, Socket } from "socket.io";

import { prisma } from "../database/prisma.js";

import { logger } from "../utils/logger.js";

const PROJECT_ROOM_PREFIX =
  "project:";

export function projectRoom(
  projectId: string,
) {
  return `${PROJECT_ROOM_PREFIX}${projectId}`;
}

export function registerProjectRooms(
  io: Server,
) {
  io.on(
    "connection",
    (socket) => {
      socket.on(
        "project:join",
        async (
          projectId: unknown,
        ) => {
          if (
            typeof projectId !==
              "string" ||
            projectId.length === 0
          ) {
            socket.emit(
              "project:error",
              {
                message:
                  "Project ID is required",
              },
            );

            return;
          }

          const userId =
            socket.data.userId;

          try {
            const membership =
              await prisma.projectMember.findUnique(
                {
                  where: {
                    projectId_userId: {
                      projectId,
                      userId,
                    },
                  },

                  select: {
                    id: true,
                    role: true,
                  },
                },
              );

            if (!membership) {
              socket.emit(
                "project:error",
                {
                  message:
                    "You are not a member of this project",
                },
              );

              return;
            }

            const room =
              projectRoom(
                projectId,
              );

            await socket.join(
              room,
            );

            socket.emit(
              "project:joined",
              {
                projectId,
              },
            );

            logger.info(
              {
                socketId:
                  socket.id,
                userId,
                projectId,
              },
              "Socket joined project room",
            );
          } catch (error) {
            logger.error(
              {
                socketId:
                  socket.id,
                userId,
                projectId,
                err: error,
              },
              "Failed to join project room",
            );

            socket.emit(
              "project:error",
              {
                message:
                  "Failed to join project",
              },
            );
          }
        },
      );

      socket.on(
        "project:leave",
        async (
          projectId: unknown,
        ) => {
          if (
            typeof projectId !==
              "string" ||
            projectId.length === 0
          ) {
            return;
          }

          const room =
            projectRoom(
              projectId,
            );

          await socket.leave(
            room,
          );

          logger.info(
            {
              socketId:
                socket.id,
              userId:
                socket.data.userId,
              projectId,
            },
            "Socket left project room",
          );
        },
      );
    },
  );
}