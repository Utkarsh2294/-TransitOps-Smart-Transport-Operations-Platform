import { Router } from "express";

import {
  createExpenseController,
  createFuelLogController,
  getExpensesController,
  getFuelLogsController,
  getVehicleCostSummaryController,
} from "../controllers/finance.controller.js";
import { requireAuth, requireRoles } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const financeRouter = Router();

financeRouter.use(requireAuth);

financeRouter.get(
  "/fuel-logs",
  requireRoles("fleet_manager", "driver", "financial_analyst"),
  asyncHandler(getFuelLogsController),
);
financeRouter.post(
  "/fuel-logs",
  requireRoles("fleet_manager", "driver"),
  asyncHandler(createFuelLogController),
);
financeRouter.get(
  "/expenses",
  requireRoles("fleet_manager", "financial_analyst"),
  asyncHandler(getExpensesController),
);
financeRouter.post(
  "/expenses",
  requireRoles("fleet_manager", "financial_analyst"),
  asyncHandler(createExpenseController),
);
financeRouter.get(
  "/vehicles/:vehicleId/cost-summary",
  requireRoles("fleet_manager", "financial_analyst"),
  asyncHandler(getVehicleCostSummaryController),
);

