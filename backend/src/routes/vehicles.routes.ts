import { Router } from "express";

import {
  createVehicleController,
  deleteVehicleController,
  getAvailableVehiclesController,
  getVehicleController,
  getVehiclesController,
  updateVehicleController,
} from "../controllers/vehicles.controller.js";
import { requireAuth, requireRoles } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const vehiclesRouter = Router();

vehiclesRouter.use(requireAuth);

vehiclesRouter.get(
  "/available",
  requireRoles("fleet_manager", "safety_officer", "financial_analyst"),
  asyncHandler(getAvailableVehiclesController),
);
vehiclesRouter.get(
  "/",
  requireRoles("fleet_manager", "safety_officer", "financial_analyst"),
  asyncHandler(getVehiclesController),
);
vehiclesRouter.get(
  "/:id",
  requireRoles("fleet_manager", "safety_officer", "financial_analyst"),
  asyncHandler(getVehicleController),
);
vehiclesRouter.post("/", requireRoles("fleet_manager"), asyncHandler(createVehicleController));
vehiclesRouter.put("/:id", requireRoles("fleet_manager"), asyncHandler(updateVehicleController));
vehiclesRouter.delete("/:id", requireRoles("fleet_manager"), asyncHandler(deleteVehicleController));

