import { Router } from "express";

import { getFleetInsightsController } from "../controllers/insights.controller.js";
import { requireAuth, requireRoles } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const insightsRouter = Router();

insightsRouter.use(requireAuth);

insightsRouter.get(
  "/fleet",
  requireRoles("fleet_manager", "financial_analyst"),
  asyncHandler(getFleetInsightsController),
);
