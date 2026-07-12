export const vehicleStatuses = ["Available", "On Trip", "In Shop", "Retired"] as const;
export const driverStatuses = ["Available", "On Trip", "Off Duty", "Suspended"] as const;
export const tripStatuses = ["Draft", "Dispatched", "Completed", "Cancelled"] as const;

export type VehicleStatus = (typeof vehicleStatuses)[number];
export type DriverStatus = (typeof driverStatuses)[number];
export type TripStatus = (typeof tripStatuses)[number];

export interface DispatchVehicleSnapshot {
  status: VehicleStatus;
  maxLoadCapacityKg: number;
}

export interface DispatchDriverSnapshot {
  status: DriverStatus;
  licenseExpiryDate: Date;
}

