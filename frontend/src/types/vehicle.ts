export type VehicleStatus = "Available" | "On_Trip" | "In_Shop" | "Retired";

export type Vehicle = {
  id: number;
  regNumber: string;
  name: string;
  type: string;
  maxLoadCapacityKg: number;
  odometerKm: number;
  acquisitionCost: number;
  status: VehicleStatus;
  serviceIntervalKm: number | null;
  lastServiceOdometerKm: number | null;
  documentCount: number;
  createdAt: string;
};

export type VehicleFormValues = {
  regNumber: string;
  name: string;
  type: string;
  maxLoadCapacityKg: string;
  odometerKm: string;
  acquisitionCost: string;
  status: VehicleStatus;
  serviceIntervalKm: string;
};

export type VehicleDocument = {
  id: number;
  vehicleId: number;
  docType: "RC" | "Insurance" | "PUC" | "Permit" | "Other";
  fileUrl: string;
  fileName: string;
  expiryDate: string | null;
  uploadedAt: string;
};

export type ServiceStatus = { dueInKm: number | null; isOverdue: boolean; isDueSoon: boolean; configured: boolean };

export type VehicleListResponse = {
  data: Vehicle[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type VehicleResponse = {
  data: Vehicle;
};

