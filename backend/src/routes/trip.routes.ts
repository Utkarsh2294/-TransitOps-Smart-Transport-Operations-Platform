import { Router } from "express";
import {
  cancelTripController,
  completeTripController,
  createTripController,
  dispatchTripController,
  getTripsController,
  getTripByIdController,
} from "../controllers/trips.controller.js";
import { requireAuth, requireRoles } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const tripRouter = Router();

tripRouter.use(requireAuth);

tripRouter.get(
  "/",
  requireRoles("fleet_manager", "driver", "financial_analyst"),
  asyncHandler(getTripsController),
);
tripRouter.get(
  "/:tripId",
  requireRoles("fleet_manager", "driver", "financial_analyst"),
  asyncHandler(getTripByIdController),
);
tripRouter.post("/", requireRoles("fleet_manager", "driver"), asyncHandler(createTripController));
tripRouter.post(
  "/:tripId/dispatch",
  requireRoles("fleet_manager", "driver"),
  asyncHandler(dispatchTripController),
);
tripRouter.post(
  "/:tripId/complete",
  requireRoles("fleet_manager", "driver"),
  asyncHandler(completeTripController),
);
tripRouter.post(
  "/:tripId/cancel",
  requireRoles("fleet_manager", "driver"),
  asyncHandler(cancelTripController),
);
