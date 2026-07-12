import { Prisma, TripStatus } from "@prisma/client";
import { z } from "zod";

import { prisma } from "../config/prisma.js";
import { ApiError } from "../utils/apiError.js";
import type { Pagination } from "../utils/pagination.js";
import { assertDraftAssignmentAllowed } from "./tripRules.js";

export const createTripSchema = z.object({
  source: z.string().trim().min(1, "Source is required"),
  destination: z.string().trim().min(1, "Destination is required"),
  vehicleId: z.coerce.number().int().positive("Vehicle id must be a positive integer"),
  driverId: z.coerce.number().int().positive("Driver id must be a positive integer"),
  cargoWeightKg: z.coerce.number().nonnegative("Cargo weight cannot be negative"),
  plannedDistanceKm: z.coerce.number().nonnegative("Planned distance cannot be negative"),
});

type CreateTripInput = z.infer<typeof createTripSchema> & {
  createdById: number;
};

const serializeTrip = (trip: {
  id: number;
  source: string;
  destination: string;
  vehicleId: number;
  driverId: number;
  cargoWeightKg: Prisma.Decimal;
  plannedDistanceKm: Prisma.Decimal;
  finalOdometerKm: Prisma.Decimal | null;
  fuelConsumedLiters: Prisma.Decimal | null;
  status: TripStatus;
  createdById: number;
  createdAt: Date;
}) => ({
  ...trip,
  cargoWeightKg: Number(trip.cargoWeightKg),
  plannedDistanceKm: Number(trip.plannedDistanceKm),
  finalOdometerKm: trip.finalOdometerKm === null ? null : Number(trip.finalOdometerKm),
  fuelConsumedLiters:
    trip.fuelConsumedLiters === null ? null : Number(trip.fuelConsumedLiters),
});

export const listTrips = async ({ limit, page, skip }: Pagination) => {
  const [total, trips] = await prisma.$transaction([
    prisma.trip.count(),
    prisma.trip.findMany({
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
  ]);

  return {
    data: trips.map(serializeTrip),
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const createTrip = async (input: CreateTripInput) =>
  prisma.$transaction(async (tx) => {
    const [vehicle, driver] = await Promise.all([
      tx.vehicle.findUnique({ where: { id: input.vehicleId } }),
      tx.driver.findUnique({ where: { id: input.driverId } }),
    ]);

    if (!vehicle) {
      throw new ApiError(404, "vehicleId", "Vehicle not found");
    }

    if (!driver) {
      throw new ApiError(404, "driverId", "Driver not found");
    }

    assertDraftAssignmentAllowed({
      vehicleStatus: vehicle.status,
      vehicleCapacityKg: Number(vehicle.maxLoadCapacityKg),
      driverStatus: driver.status,
      licenseExpiryDate: driver.licenseExpiryDate,
      cargoWeightKg: input.cargoWeightKg,
    });

    const trip = await tx.trip.create({
      data: {
        source: input.source,
        destination: input.destination,
        vehicleId: input.vehicleId,
        driverId: input.driverId,
        cargoWeightKg: new Prisma.Decimal(input.cargoWeightKg),
        plannedDistanceKm: new Prisma.Decimal(input.plannedDistanceKm),
        createdById: input.createdById,
        status: TripStatus.Draft,
      },
    });

    return serializeTrip(trip);
  });



import { getVehicleCostReport } from "./reports.service.js";

export const getTripById = async (id: number) => {
  const trip = await prisma.trip.findUnique({
    where: { id },
    include: { vehicle: true, driver: true }
  });
  
  if (!trip) throw new ApiError(404, "tripId", "Trip not found");
  
  let plannedVsActualDistanceDeltaKm = null;
  let actualEfficiency = null;
  let efficiencyVsVehicleAverage = null;
  
  if (trip.status === 'Completed' && trip.fuelConsumedLiters) {
    const plannedDist = Number(trip.plannedDistanceKm);
    const fuel = Number(trip.fuelConsumedLiters);
    actualEfficiency = fuel > 0 ? Number((plannedDist / fuel).toFixed(2)) : 0;
    
    // We assume actual distance is roughly planned distance since startOdometer isn't tracked in schema
    plannedVsActualDistanceDeltaKm = 0; 
    
    const vehicleCosts = await getVehicleCostReport();
    const vc = vehicleCosts.find(v => v.vehicleId === trip.vehicleId);
    if (vc && vc.fuelEfficiencyKmPerLiter) {
      efficiencyVsVehicleAverage = Number((actualEfficiency - vc.fuelEfficiencyKmPerLiter).toFixed(2));
    }
  }
  
  return {
    ...serializeTrip(trip),
    vehicle: { regNumber: trip.vehicle.regNumber, name: trip.vehicle.name },
    driver: { name: trip.driver.name },
    plannedVsActualDistanceDeltaKm,
    actualEfficiency,
    efficiencyVsVehicleAverage
  };
};
