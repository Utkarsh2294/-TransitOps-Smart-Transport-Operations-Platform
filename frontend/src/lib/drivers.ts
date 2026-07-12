import { apiRequest } from "./api";
import type { Driver, DriverFormValues, DriverListResponse, DriverResponse } from "../types/driver";

const toDriverPayload = (values: DriverFormValues) => ({
  name: values.name,
  licenseNumber: values.licenseNumber,
  licenseCategory: values.licenseCategory,
  licenseExpiryDate: values.licenseExpiryDate,
  contactNumber: values.contactNumber,
  safetyScore: Number(values.safetyScore || 100),
  status: values.status,
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
    body: JSON.stringify(toDriverPayload(values)),
  });

export const deleteDriver = (driver: Driver) =>
  apiRequest<void>(`/drivers/${driver.id}`, {
    method: "DELETE",
  });

