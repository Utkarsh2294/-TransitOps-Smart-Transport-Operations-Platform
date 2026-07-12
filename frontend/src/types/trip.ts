export type TripStatus = "Draft" | "Dispatched" | "Completed" | "Cancelled";

export type Trip = {
  id: number;
  source: string;
  destination: string;
  vehicleId: number;
  driverId: number;
  cargoWeightKg: number;
  plannedDistanceKm: number;
  finalOdometerKm: number | null;
  fuelConsumedLiters: number | null;
  status: TripStatus;
  createdById: number;
  createdAt: string;
  actualCost?: number;
  plannedCost?: number;
  costDeviationPercent?: number;
  efficiencyKmPerLiter?: number;
};

export type TripFormValues = {
  source: string;
  destination: string;
  vehicleId: string;
  driverId: string;
  cargoWeightKg: string;
  plannedDistanceKm: string;
};

export type CompleteTripFormValues = {
  finalOdometerKm: string;
  fuelConsumedLiters: string;
};

export type TripListResponse = {
  data: Trip[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type TripResponse = {
  data: Trip;
};

