import { apiRequest } from "./api";
import type { Vehicle, VehicleFormValues, VehicleListResponse, VehicleResponse } from "../types/vehicle";

const toVehiclePayload = (values: VehicleFormValues) => ({
  regNumber: values.regNumber,
  name: values.name,
  type: values.type,
  maxLoadCapacityKg: Number(values.maxLoadCapacityKg),
  odometerKm: Number(values.odometerKm || 0),
  acquisitionCost: Number(values.acquisitionCost),
  status: values.status,
});

export const getVehicles = (page = 1) =>
  apiRequest<VehicleListResponse>(`/vehicles?page=${page}&limit=10`);

export const createVehicle = (values: VehicleFormValues) =>
  apiRequest<VehicleResponse>("/vehicles", {
    method: "POST",
    body: JSON.stringify(toVehiclePayload(values)),
  });

export const updateVehicle = (vehicle: Vehicle, values: VehicleFormValues) =>
  apiRequest<VehicleResponse>(`/vehicles/${vehicle.id}`, {
    method: "PUT",
    body: JSON.stringify(toVehiclePayload(values)),
  });

export const deleteVehicle = (vehicle: Vehicle) =>
  apiRequest<void>(`/vehicles/${vehicle.id}`, {
    method: "DELETE",
  });

