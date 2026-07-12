import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";

import { env } from "./config/env.js";
import { errorHandler, notFoundHandler } from "./middleware/error.js";
import { healthRouter } from "./routes/health.routes.js";
import { tripRouter } from "./routes/trip.routes.js";
import { vehiclesRouter } from "./routes/vehicles.routes.js";

export const createApp = () => {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: env.CORS_ORIGIN,
      credentials: true,
    }),
  );
  app.use(express.json({ limit: "1mb" }));
  app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));

  app.use("/api/health", healthRouter);
  app.use("/api/trips", tripRouter);
  app.use("/api/vehicles", vehiclesRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
