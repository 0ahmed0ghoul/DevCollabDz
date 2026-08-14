import express from "express";
import cors from "cors";
import authRoutes from "./modules/auth/auth.routes.js";
import usersRoutes from "./modules/users/users.routes.js";
import organizationRoutes from "./modules/organizations/organization.routes.js";
import projectRoutes from "./modules/projects/project.router.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    service: "devcollab-api",
  });
});
app.use("/api", projectRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/organizations",organizationRoutes);


export default app;