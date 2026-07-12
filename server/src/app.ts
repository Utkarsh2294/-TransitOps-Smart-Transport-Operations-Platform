import cors from "cors";
import express from "express";
import { errorHandler } from "./middleware/errorHandler.js";
import { tripRouter } from "./routes/trip.routes.js";

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.json({ status: "ok", service: "transitops-api" });
  });

  app.use("/api/trips", tripRouter);
  app.use(errorHandler);

  return app;
}

