import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";

import { env } from "./config/env.js";
import { errorHandler, notFoundHandler } from "./middleware/error.js";
import { driversRouter } from "./routes/drivers.routes.js";
import { financeRouter } from "./routes/finance.routes.js";
import { healthRouter } from "./routes/health.routes.js";
import { maintenanceRouter } from "./routes/maintenance.routes.js";
import { tripRouter } from "./routes/trip.routes.js";
import { vehiclesRouter } from "./routes/vehicles.routes.js";

export const createApp = () => {
  const app = express();
  const corsOrigins = env.CORS_ORIGIN.split(",").map((origin) => origin.trim());

  app.use(helmet());
  app.use(
    cors({
      origin: corsOrigins,
      credentials: true,
    }),
  );
  app.use(express.json({ limit: "1mb" }));
  app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));

  app.use("/api/health", healthRouter);
  app.use("/api/drivers", driversRouter);
  app.use("/api/finance", financeRouter);
  app.use("/api/maintenance", maintenanceRouter);
  app.use("/api/trips", tripRouter);
  app.use("/api/vehicles", vehiclesRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
