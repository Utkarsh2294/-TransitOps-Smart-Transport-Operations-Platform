import { Router } from "express";

import {
  exportVehicleCostReportController,
  exportCompliancePdfController,
  getFleetDashboardReportController,
  getVehicleCostReportController,
  getFuelAnomaliesController,
  getFinancialBriefController,
  getBudgetStatusController,
  getTripEfficiencyRankingsController,
  saveSnapshotController,
  getSnapshotsController
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
reportsRouter.get("/compliance-pdf", requireRoles("fleet_manager", "safety_officer", "financial_analyst"), asyncHandler(exportCompliancePdfController));
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

reportsRouter.get(
  "/fuel-anomalies",
  requireRoles("fleet_manager", "financial_analyst"),
  asyncHandler(getFuelAnomaliesController)
);

reportsRouter.get(
  "/financial-brief",
  requireRoles("fleet_manager", "financial_analyst"),
  asyncHandler(getFinancialBriefController)
);

reportsRouter.get(
  "/budget-status",
  requireRoles("fleet_manager", "financial_analyst"),
  asyncHandler(getBudgetStatusController)
);

reportsRouter.get(
  "/trip-efficiency",
  requireRoles("fleet_manager", "financial_analyst"),
  asyncHandler(getTripEfficiencyRankingsController)
);

reportsRouter.post(
  "/snapshot",
  requireRoles("fleet_manager", "financial_analyst"),
  asyncHandler(saveSnapshotController)
);

reportsRouter.get(
  "/snapshots",
  requireRoles("fleet_manager", "financial_analyst"),
  asyncHandler(getSnapshotsController)
);

