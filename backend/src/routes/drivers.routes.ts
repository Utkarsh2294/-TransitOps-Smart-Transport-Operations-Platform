import { Router } from "express";

import {
  createDriverController,
  deleteDriverController,
  getAvailableDriversController,
  getDriverController,
  getDriversController,
  unsuspendDriverController,
  updateDriverController,
} from "../controllers/drivers.controller.js";
import { requireAuth, requireRoles } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const driversRouter = Router();

driversRouter.use(requireAuth);

driversRouter.get(
  "/available",
  requireRoles("fleet_manager", "safety_officer", "financial_analyst"),
  asyncHandler(getAvailableDriversController),
);
driversRouter.get(
  "/",
  requireRoles("fleet_manager", "safety_officer", "financial_analyst"),
  asyncHandler(getDriversController),
);
driversRouter.get(
  "/:id",
  requireRoles("fleet_manager", "safety_officer", "financial_analyst"),
  asyncHandler(getDriverController),
);
driversRouter.patch(
  "/:id/unsuspend",
  requireRoles("fleet_manager", "safety_officer"),
  asyncHandler(unsuspendDriverController),
);
driversRouter.post("/", requireRoles("fleet_manager"), asyncHandler(createDriverController));
driversRouter.put("/:id", requireRoles("fleet_manager"), asyncHandler(updateDriverController));
driversRouter.delete("/:id", requireRoles("fleet_manager"), asyncHandler(deleteDriverController));

