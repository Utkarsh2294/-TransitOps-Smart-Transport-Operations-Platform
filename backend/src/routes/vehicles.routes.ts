import { Router } from "express";

import {
  createVehicleController,
  bulkUpdateVehicleStatusController,
  deleteVehicleDocumentController,
  deleteVehicleController,
  getAvailableVehiclesController,
  getVehicleController,
  getVehicleDocumentsController,
  getVehicleServiceStatusController,
  getVehiclesController,
  updateVehicleController,
  uploadVehicleDocumentController,
} from "../controllers/vehicles.controller.js";
import { documentUpload } from "../middleware/upload.js";
import { requireAuth, requireRoles } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const vehiclesRouter = Router();

vehiclesRouter.use(requireAuth);

vehiclesRouter.get(
  "/available",
  requireRoles("fleet_manager", "safety_officer", "financial_analyst"),
  asyncHandler(getAvailableVehiclesController),
);
vehiclesRouter.patch("/bulk-status", requireRoles("fleet_manager"), asyncHandler(bulkUpdateVehicleStatusController));
vehiclesRouter.get("/:id/documents", requireRoles("fleet_manager", "safety_officer", "financial_analyst"), asyncHandler(getVehicleDocumentsController));
vehiclesRouter.post("/:id/documents", requireRoles("fleet_manager", "safety_officer"), documentUpload.single("file"), asyncHandler(uploadVehicleDocumentController));
vehiclesRouter.delete("/:id/documents/:docId", requireRoles("fleet_manager", "safety_officer"), asyncHandler(deleteVehicleDocumentController));
vehiclesRouter.get("/:id/service-status", requireRoles("fleet_manager", "safety_officer", "financial_analyst"), asyncHandler(getVehicleServiceStatusController));
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

