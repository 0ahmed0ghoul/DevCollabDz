import "dotenv/config";

import { createServer } from "node:http";
import { Server } from "socket.io";

import app from "./app.js";
import { redis } from "./database/redis.js";
import { logger } from "./utils/logger.js";
import { socketAuthMiddleware } from "./realtime/socket-auth.js";
import { registerProjectRooms } from "./realtime/project-rooms.js";
import { setSocketServer } from "./realtime/socket-server.js";

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    try {
      await redis.connect();

      logger.info("Redis connected");
    } catch (error) {
      logger.warn(
        {
          err: error,
        },
        "Redis unavailable. Starting without cache."
      );
    }

    /*
     * Create ONE HTTP server.
     * Express and Socket.IO both use it.
     */
    const httpServer = createServer(app);

    /*
     * Attach Socket.IO to the same
     * HTTP server.
     */
    const io = new Server(httpServer, {
      cors: {
        origin: process.env.WEB_ORIGIN || "http://localhost:8080",
        credentials: true,
      },
    });
    
    io.engine.on("connection_error", (error) => {
      logger.error(
        {
          code: error.code,
          message: error.message,
          context: error.context,
        },
        "Socket.IO engine connection error"
      );
    });

    io.use(socketAuthMiddleware);
    registerProjectRooms(io);
    setSocketServer(io);

    io.on("connect_error", (error) => {
      logger.warn(
        {
          message: error.message,
        },
        "Socket.IO namespace connection error"
      );
    });

    io.on("connection", (socket) => {
      logger.info(
        {
          socketId: socket.id,
        },
        "WebSocket client connected"
      );

      socket.on("disconnect", (reason) => {
        logger.info(
          {
            socketId: socket.id,
            reason,
          },
          "WebSocket client disconnected"
        );
      });
    });

    /*
     * Start the HTTP server ONCE.
     */
    httpServer.listen(PORT, () => {
      logger.info(
        {
          port: PORT,
        },
        "DevCollab API running"
      );
    });
  } catch (error) {
    logger.fatal(
      {
        err: error,
      },
      "Failed to start server"
    );

    process.exit(1);
  }
}

void startServer();
