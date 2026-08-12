import express from "express";
import cors from "cors";
import authRoutes from "./modules/auth/auth.routes.js";
import usersRoutes from "./modules/users/users.routes.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    service: "devcollab-api",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);

export default app;