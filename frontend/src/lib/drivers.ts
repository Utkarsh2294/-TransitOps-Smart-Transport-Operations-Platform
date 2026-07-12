import { apiRequest } from "./api";
import type { Driver, DriverFormValues, DriverListResponse, DriverResponse, SafetyScoreEvent } from "../types/driver";

const toDriverPayload = (values: DriverFormValues, includeStatus = true) => ({
  name: values.name,
  licenseNumber: values.licenseNumber,
  licenseCategory: values.licenseCategory,
  licenseExpiryDate: values.licenseExpiryDate,
  contactNumber: values.contactNumber,
  safetyScore: Number(values.safetyScore || 100),
  ...(includeStatus ? { status: values.status } : {}),
});

export const getDrivers = (page = 1, limit = 10) =>
  apiRequest<DriverListResponse>(`/drivers?page=${page}&limit=${limit}`);

export const unsuspendDriver = (driverId: number) =>
  apiRequest<DriverResponse>(`/drivers/${driverId}/unsuspend`, {
    method: "PATCH",
  });

export const createDriver = (values: DriverFormValues) =>
  apiRequest<DriverResponse>("/drivers", {
    method: "POST",
    body: JSON.stringify(toDriverPayload(values)),
  });

export const updateDriver = (driver: Driver, values: DriverFormValues) =>
  apiRequest<DriverResponse>(`/drivers/${driver.id}`, {
    method: "PUT",
    body: JSON.stringify(toDriverPayload(values, values.status !== driver.status)),
  });

export const deleteDriver = (driver: Driver) =>
  apiRequest<void>(`/drivers/${driver.id}`, {
    method: "DELETE",
  });

export const bulkUpdateDriverStatus = (ids: number[], status: Driver["status"]) => apiRequest<{ data: { id: number; success: boolean; message?: string }[] }>("/drivers/bulk-status", { method: "PATCH", body: JSON.stringify({ ids, status }) });
export const getSafetyHistory = (driverId: number) => apiRequest<{ data: SafetyScoreEvent[] }>(`/drivers/${driverId}/safety-history`);
export const createSafetyEvent = (driverId: number, score: number, reason?: string) => apiRequest<{ data: SafetyScoreEvent }>(`/drivers/${driverId}/safety-events`, { method: "POST", body: JSON.stringify({ score, reason }) });

