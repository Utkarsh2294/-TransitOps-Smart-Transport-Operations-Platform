import { Router } from "express";

import { searchController } from "../controllers/search.controller.js";
import { requireAuth, requireRoles } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const searchRouter = Router();
searchRouter.use(requireAuth);
searchRouter.get("/", requireRoles("fleet_manager", "safety_officer", "financial_analyst"), asyncHandler(searchController));
