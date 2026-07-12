import { apiRequest } from "./api";
import type { MaintenanceListResponse, MaintenanceResponse } from "../types/maintenance";

export const getVehicleMaintenance = (vehicleId: number) =>
  apiRequest<MaintenanceListResponse>(`/maintenance?vehicleId=${vehicleId}&limit=100`);

export const openMaintenance = (vehicleId: number, type: string, cost: number) =>
  apiRequest<MaintenanceResponse>("/maintenance", {
    method: "POST",
    body: JSON.stringify({ vehicleId, type, cost }),
  });

export const closeMaintenance = (maintenanceId: number) =>
  apiRequest<MaintenanceResponse>(`/maintenance/${maintenanceId}/close`, {
    method: "PATCH",
  });
