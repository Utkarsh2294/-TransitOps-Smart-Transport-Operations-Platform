import { apiRequest } from "./api";
import type { ServiceStatus, Vehicle, VehicleDocument, VehicleFormValues, VehicleListResponse, VehicleResponse } from "../types/vehicle";

const toVehiclePayload = (values: VehicleFormValues, includeStatus = true) => ({
  regNumber: values.regNumber,
  name: values.name,
  type: values.type,
  maxLoadCapacityKg: Number(values.maxLoadCapacityKg),
  odometerKm: Number(values.odometerKm || 0),
  acquisitionCost: Number(values.acquisitionCost),
  serviceIntervalKm: values.serviceIntervalKm ? Number(values.serviceIntervalKm) : null,
  ...(includeStatus ? { status: values.status } : {}),
});

export const getVehicles = (page = 1, limit = 100) =>
  apiRequest<VehicleListResponse>(`/vehicles?page=${page}&limit=${limit}`);

export const createVehicle = (values: VehicleFormValues) =>
  apiRequest<VehicleResponse>("/vehicles", {
    method: "POST",
    body: JSON.stringify(toVehiclePayload(values)),
  });

export const updateVehicle = (vehicle: Vehicle, values: VehicleFormValues) =>
  apiRequest<VehicleResponse>(`/vehicles/${vehicle.id}`, {
    method: "PUT",
    body: JSON.stringify(toVehiclePayload(values, values.status !== vehicle.status)),
  });

export const deleteVehicle = (vehicle: Vehicle) =>
  apiRequest<void>(`/vehicles/${vehicle.id}`, {
    method: "DELETE",
  });

export const getVehicleDocuments = (vehicleId: number) => apiRequest<{ data: VehicleDocument[] }>(`/vehicles/${vehicleId}/documents`);
export const uploadVehicleDocument = (vehicleId: number, values: { file: File; docType: VehicleDocument["docType"]; expiryDate?: string }) => {
  const form = new FormData();
  form.append("file", values.file);
  form.append("docType", values.docType);
  if (values.expiryDate) form.append("expiryDate", values.expiryDate);
  return apiRequest<{ data: VehicleDocument }>(`/vehicles/${vehicleId}/documents`, { method: "POST", body: form });
};
export const deleteVehicleDocument = (vehicleId: number, documentId: number) => apiRequest<void>(`/vehicles/${vehicleId}/documents/${documentId}`, { method: "DELETE" });
export const getServiceStatus = (vehicleId: number) => apiRequest<{ data: ServiceStatus }>(`/vehicles/${vehicleId}/service-status`);
export const bulkUpdateVehicleStatus = (ids: number[], status: Vehicle["status"]) => apiRequest<{ data: { id: number; success: boolean; message?: string }[] }>("/vehicles/bulk-status", { method: "PATCH", body: JSON.stringify({ ids, status }) });

