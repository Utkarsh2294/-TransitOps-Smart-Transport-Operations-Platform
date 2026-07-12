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
};

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

