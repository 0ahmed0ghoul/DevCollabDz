import "dotenv/config";

import app from "./app.js";
import { redis } from "./database/redis.js";

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await redis.connect();

    console.log("✅ Redis connected");

    app.listen(
      PORT,
      () => {
        console.log(
          `🚀 DevCollab API running on port ${PORT}`,
        );
      },
    );
  } catch (error) {
    console.error(
      "❌ Failed to start server:",
      error,
    );

    process.exit(1);
  }
}

void startServer();