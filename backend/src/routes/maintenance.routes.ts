import { Router } from "express";

import {
  closeMaintenanceController,
  getMaintenanceController,
  openMaintenanceController,
} from "../controllers/maintenance.controller.js";
import { requireAuth, requireRoles } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const maintenanceRouter = Router();

maintenanceRouter.use(requireAuth);

maintenanceRouter.get(
  "/",
  requireRoles("fleet_manager", "safety_officer", "financial_analyst"),
  asyncHandler(getMaintenanceController),
);
maintenanceRouter.post(
  "/",
  requireRoles("fleet_manager", "safety_officer"),
  asyncHandler(openMaintenanceController),
);
maintenanceRouter.patch(
  "/:id/close",
  requireRoles("fleet_manager", "safety_officer"),
  asyncHandler(closeMaintenanceController),
);

