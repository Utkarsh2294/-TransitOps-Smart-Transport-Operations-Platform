import { Router } from "express";

import { getComplianceAlertsController } from "../controllers/safety.controller.js";
import { requireAuth, requireRoles } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const safetyRouter = Router();
safetyRouter.use(requireAuth);
safetyRouter.get("/alerts", requireRoles("fleet_manager", "safety_officer", "financial_analyst"), asyncHandler(getComplianceAlertsController));
