import express from "express";
import cors from "cors";
import authRoutes from "./modules/auth/auth.routes.js";
import usersRoutes from "./modules/users/users.routes.js";
import organizationRoutes from "./modules/organizations/organization.routes.js";
import projectRoutes from "./modules/projects/project.router.js";
import taskRoutes from "./modules/tasks/task.routes.js";

import { notFoundMiddleware } from "./middleware/not-found.middleware.js";
import {
  requestIdMiddleware,
} from "./middleware/request-id.middleware.js";

import {
  requestLoggerMiddleware,
} from "./middleware/request-logger.middleware.js";

import {
  errorHandler,
} from "./middleware/error.middleware.js";

const app = express();
app.use(
  requestIdMiddleware,
);

app.use(
  requestLoggerMiddleware,
);
app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    service: "devcollab-api",
  });
});
app.use("/api", projectRoutes);
app.use("/api", taskRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/organizations",organizationRoutes);

// 404 handler — must come after all routes
app.use(notFoundMiddleware);

// Global error handler — must be last
app.use(errorHandler);
export default app;