import { Prisma, VehicleStatus } from "@prisma/client";
import { z } from "zod";

import { prisma } from "../config/prisma.js";
import { ApiError } from "../utils/apiError.js";
import type { Pagination } from "../utils/pagination.js";

const vehicleStatusSchema = z.nativeEnum(VehicleStatus);

const vehicleBaseSchema = z.object({
  regNumber: z
    .string()
    .trim()
    .min(1, "Registration number is required")
    .transform((value) => value.toUpperCase()),
  name: z.string().trim().min(1, "Vehicle name is required"),
  type: z.string().trim().min(1, "Vehicle type is required"),
  maxLoadCapacityKg: z.coerce
    .number()
    .positive("Maximum load capacity must be a positive number"),
  odometerKm: z.coerce.number().nonnegative("Odometer reading cannot be negative").default(0),
  acquisitionCost: z.coerce
    .number()
    .nonnegative("Acquisition cost cannot be negative"),
  status: vehicleStatusSchema.default(VehicleStatus.Available),
});

export const createVehicleSchema = vehicleBaseSchema;

export const updateVehicleSchema = vehicleBaseSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  {
    message: "At least one vehicle field is required",
  },
);

const serializeVehicle = (vehicle: {
  id: number;
  regNumber: string;
  name: string;
  type: string;
  maxLoadCapacityKg: Prisma.Decimal;
  odometerKm: Prisma.Decimal;
  acquisitionCost: Prisma.Decimal;
  status: VehicleStatus;
  createdAt: Date;
}) => ({
  ...vehicle,
  maxLoadCapacityKg: Number(vehicle.maxLoadCapacityKg),
  odometerKm: Number(vehicle.odometerKm),
  acquisitionCost: Number(vehicle.acquisitionCost),
});

const handlePrismaVehicleError = (error: unknown): never => {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      throw new ApiError(409, "regNumber", "A vehicle with this registration number already exists");
    }

    if (error.code === "P2025") {
      throw new ApiError(404, "vehicle", "Vehicle not found");
    }
  }

  throw error;
};

export const listVehicles = async ({ limit, page, skip }: Pagination) => {
  const [total, vehicles] = await prisma.$transaction([
    prisma.vehicle.count(),
    prisma.vehicle.findMany({
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
  ]);

  return {
    data: vehicles.map(serializeVehicle),
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const listAvailableVehicles = async () => {
  const vehicles = await prisma.vehicle.findMany({
    where: { status: VehicleStatus.Available },
    orderBy: { regNumber: "asc" },
    take: 100,
  });

  return vehicles.map(serializeVehicle);
};

export const getVehicleById = async (id: number) => {
  const vehicle = await prisma.vehicle.findUnique({ where: { id } });

  if (!vehicle) {
    throw new ApiError(404, "vehicle", "Vehicle not found");
  }

  return serializeVehicle(vehicle);
};

export const createVehicle = async (input: z.infer<typeof createVehicleSchema>) => {
  try {
    const vehicle = await prisma.vehicle.create({
      data: {
        ...input,
        maxLoadCapacityKg: new Prisma.Decimal(input.maxLoadCapacityKg),
        odometerKm: new Prisma.Decimal(input.odometerKm),
        acquisitionCost: new Prisma.Decimal(input.acquisitionCost),
      },
    });

    return serializeVehicle(vehicle);
  } catch (error) {
    handlePrismaVehicleError(error);
  }
};

export const updateVehicle = async (id: number, input: z.infer<typeof updateVehicleSchema>) => {
  try {
    const vehicle = await prisma.vehicle.update({
      where: { id },
      data: {
        ...input,
        maxLoadCapacityKg:
          input.maxLoadCapacityKg === undefined
            ? undefined
            : new Prisma.Decimal(input.maxLoadCapacityKg),
        odometerKm: input.odometerKm === undefined ? undefined : new Prisma.Decimal(input.odometerKm),
        acquisitionCost:
          input.acquisitionCost === undefined ? undefined : new Prisma.Decimal(input.acquisitionCost),
      },
    });

    return serializeVehicle(vehicle);
  } catch (error) {
    handlePrismaVehicleError(error);
  }
};

export const deleteVehicle = async (id: number) => {
  try {
    await prisma.vehicle.delete({ where: { id } });
  } catch (error) {
    handlePrismaVehicleError(error);
  }
};

