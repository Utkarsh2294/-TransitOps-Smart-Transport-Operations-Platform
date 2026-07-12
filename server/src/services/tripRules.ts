import type { DispatchDriverSnapshot, DispatchVehicleSnapshot } from "../types/domain.js";

export class TripRuleError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TripRuleError";
  }
}

interface ValidateDraftTripInput {
  vehicle: DispatchVehicleSnapshot;
  driver: DispatchDriverSnapshot;
  cargoWeightKg: number;
  now?: Date;
}

export function validateDraftTrip(input: ValidateDraftTripInput) {
  const now = input.now ?? new Date();

  if (input.vehicle.status !== "Available") {
    throw new TripRuleError("Vehicle must be available before it can be assigned to a trip.");
  }

  if (input.driver.status !== "Available") {
    throw new TripRuleError("Driver must be available before they can be assigned to a trip.");
  }

  if (input.driver.licenseExpiryDate < now) {
    throw new TripRuleError("Driver license is expired and cannot be assigned to a trip.");
  }

  if (input.cargoWeightKg > input.vehicle.maxLoadCapacityKg) {
    throw new TripRuleError("Cargo weight exceeds the selected vehicle load capacity.");
  }
}

