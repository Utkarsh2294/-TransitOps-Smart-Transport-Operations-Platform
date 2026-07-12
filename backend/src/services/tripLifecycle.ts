import { DriverStatus, VehicleStatus } from "@prisma/client";
import { prisma } from "../config/prisma.js";
import { ApiError } from "../utils/apiError.js";
import {
  assertDraftAssignmentAllowed,
  assertTripCanCancel,
  assertTripCanComplete,
  assertTripCanDispatch,
} from "./tripRules.js";

interface CompleteTripInput {
  finalOdometerKm: number;
  fuelConsumedLiters: number;
}

export const dispatchTrip = async (tripId: number) =>
  prisma.$transaction(async (tx) => {
    const trip = await tx.trip.findUnique({
      where: { id: tripId },
      include: { vehicle: true, driver: true },
    });

    if (!trip) {
      throw new ApiError(404, "tripId", "Trip not found.");
    }

    assertTripCanDispatch(trip.status);
    assertDraftAssignmentAllowed({
      vehicleStatus: trip.vehicle.status,
      vehicleCapacityKg: Number(trip.vehicle.maxLoadCapacityKg),
      driverStatus: trip.driver.status,
      licenseExpiryDate: trip.driver.licenseExpiryDate,
      cargoWeightKg: Number(trip.cargoWeightKg),
    });

    const [updatedTrip] = await Promise.all([
      tx.trip.update({
        where: { id: trip.id },
        data: { status: "Dispatched" },
      }),
      tx.vehicle.update({
        where: { id: trip.vehicleId },
        data: { status: VehicleStatus.On_Trip },
      }),
      tx.driver.update({
        where: { id: trip.driverId },
        data: { status: DriverStatus.On_Trip },
      }),
    ]);

    return updatedTrip;
  });

export const completeTrip = async (tripId: number, input: CompleteTripInput) =>
  prisma.$transaction(async (tx) => {
    const trip = await tx.trip.findUnique({
      where: { id: tripId },
      include: { vehicle: true, driver: true },
    });

    if (!trip) {
      throw new ApiError(404, "tripId", "Trip not found.");
    }

    assertTripCanComplete(trip.status);

    if (input.finalOdometerKm < Number(trip.vehicle.odometerKm)) {
      throw new ApiError(
        422,
        "finalOdometerKm",
        "Final odometer cannot be lower than current vehicle odometer.",
      );
    }

    const [updatedTrip] = await Promise.all([
      tx.trip.update({
        where: { id: trip.id },
        data: {
          status: "Completed",
          finalOdometerKm: input.finalOdometerKm,
          fuelConsumedLiters: input.fuelConsumedLiters,
        },
      }),
      tx.vehicle.update({
        where: { id: trip.vehicleId },
        data: {
          status: VehicleStatus.Available,
          odometerKm: input.finalOdometerKm,
        },
      }),
      tx.driver.update({
        where: { id: trip.driverId },
        data: { status: DriverStatus.Available },
      }),
    ]);

    return updatedTrip;
  });

export const cancelTrip = async (tripId: number) =>
  prisma.$transaction(async (tx) => {
    const trip = await tx.trip.findUnique({
      where: { id: tripId },
    });

    if (!trip) {
      throw new ApiError(404, "tripId", "Trip not found.");
    }

    assertTripCanCancel(trip.status);

    if (trip.status !== "Dispatched") {
      return tx.trip.update({
        where: { id: trip.id },
        data: { status: "Cancelled" },
      });
    }

    const [updatedTrip] = await Promise.all([
      tx.trip.update({
        where: { id: trip.id },
        data: { status: "Cancelled" },
      }),
      tx.vehicle.update({
        where: { id: trip.vehicleId },
        data: { status: VehicleStatus.Available },
      }),
      tx.driver.update({
        where: { id: trip.driverId },
        data: { status: DriverStatus.Available },
      }),
    ]);

    return updatedTrip;
  });

