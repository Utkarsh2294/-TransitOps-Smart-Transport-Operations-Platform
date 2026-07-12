export type FleetDashboardReport = {
  kpis: {
    totalVehicles: number;
    activeVehicles: number;
    availableVehicles: number;
    maintenanceVehicles: number;
    activeTrips: number;
    pendingTrips: number;
    driversOnDuty: number;
    fleetUtilizationPercent: number;
  };
  analytics: {
    fuelLiters: number;
    fuelCost: number;
    maintenanceCost: number;
    expenseCost: number;
    totalOperationalCost: number;
    completedDistanceKm: number;
    fuelEfficiencyKmPerLiter: number | null;
  };
};

export type VehicleCostReportRow = {
  vehicleId: number;
  regNumber: string;
  name: string;
  status: "Available" | "On_Trip" | "In_Shop" | "Retired";
  acquisitionCost: number;
  fuelLiters: number;
  fuelCost: number;
  maintenanceCost: number;
  expenseCost: number;
  totalOperationalCost: number;
  completedTrips: number;
  completedDistanceKm: number;
  fuelEfficiencyKmPerLiter: number | null;
  roiPercent: number | null;
};

