import { Router } from "express";

import {
  exportVehicleCostReportController,
  getFleetDashboardReportController,
  getVehicleCostReportController,
} from "../controllers/reports.controller.js";
import { requireAuth, requireRoles } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const reportsRouter = Router();

reportsRouter.use(requireAuth);

reportsRouter.get(
  "/dashboard",
  requireRoles("fleet_manager", "financial_analyst"),
  asyncHandler(getFleetDashboardReportController),
);
reportsRouter.get(
  "/vehicle-costs",
  requireRoles("fleet_manager", "financial_analyst"),
  asyncHandler(getVehicleCostReportController),
);
reportsRouter.get(
  "/vehicle-costs.csv",
  requireRoles("fleet_manager", "financial_analyst"),
  asyncHandler(exportVehicleCostReportController),
);

