import { DriverStatus, TripStatus, VehicleStatus } from "@prisma/client";
import { ApiError } from "../utils/apiError.js";

interface DraftAssignmentInput {
  vehicleStatus: VehicleStatus;
  vehicleCapacityKg: number;
  driverStatus: DriverStatus;
  licenseExpiryDate: Date;
  cargoWeightKg: number;
  now?: Date;
}

export const assertDraftAssignmentAllowed = (input: DraftAssignmentInput) => {
  const now = input.now ?? new Date();

  if (input.vehicleStatus !== VehicleStatus.Available) {
    throw new ApiError(422, "vehicleId", "Vehicle must be available before dispatch.");
  }

  if (input.driverStatus !== DriverStatus.Available) {
    throw new ApiError(422, "driverId", "Driver must be available before dispatch.");
  }

  if (input.licenseExpiryDate < now) {
    throw new ApiError(422, "driverId", "Driver license is expired and cannot be assigned.");
  }

  if (input.cargoWeightKg > input.vehicleCapacityKg) {
    throw new ApiError(422, "cargoWeightKg", "Cargo weight exceeds vehicle load capacity.");
  }
};

export const assertTripCanDispatch = (status: TripStatus) => {
  if (status !== TripStatus.Draft) {
    throw new ApiError(422, "status", "Only draft trips can be dispatched.");
  }
};

export const assertTripCanComplete = (status: TripStatus) => {
  if (status !== TripStatus.Dispatched) {
    throw new ApiError(422, "status", "Only dispatched trips can be completed.");
  }
};

export const assertTripCanCancel = (status: TripStatus) => {
  if (status === TripStatus.Completed) {
    throw new ApiError(422, "status", "Completed trips cannot be cancelled.");
  }

  if (status === TripStatus.Cancelled) {
    throw new ApiError(422, "status", "Trip is already cancelled.");
  }
};

