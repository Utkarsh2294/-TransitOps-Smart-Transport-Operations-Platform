import { DocType, Prisma, VehicleStatus } from "@prisma/client";
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
  serviceIntervalKm: z.coerce.number().int().positive("Service interval must be positive").optional().nullable(),
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
  serviceIntervalKm?: number | null;
  lastServiceOdometerKm?: Prisma.Decimal | null;
  _count?: { documents: number };
  createdAt: Date;
}) => ({
  ...vehicle,
  maxLoadCapacityKg: Number(vehicle.maxLoadCapacityKg),
  odometerKm: Number(vehicle.odometerKm),
  acquisitionCost: Number(vehicle.acquisitionCost),
  lastServiceOdometerKm: vehicle.lastServiceOdometerKm === undefined || vehicle.lastServiceOdometerKm === null
    ? null
    : Number(vehicle.lastServiceOdometerKm),
  documentCount: vehicle._count?.documents ?? 0,
});

export const assertVehicleStatusTransition = (current: VehicleStatus, next: VehicleStatus) => {
  if (current === VehicleStatus.Retired && next !== VehicleStatus.Retired) {
    throw new ApiError(400, "status", "Retired vehicles cannot be returned to active service");
  }
};

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
      include: { _count: { select: { documents: true } } },
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
    include: { _count: { select: { documents: true } } },
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
    if (input.status) {
      const current = await prisma.vehicle.findUnique({ where: { id }, select: { status: true } });
      if (!current) throw new ApiError(404, "vehicle", "Vehicle not found");
      assertVehicleStatusTransition(current.status, input.status);
    }
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

export const listVehicleDocuments = async (vehicleId: number) => {
  await getVehicleById(vehicleId);
  return prisma.vehicleDocument.findMany({ where: { vehicleId }, orderBy: { uploadedAt: "desc" } });
};

export const createVehicleDocument = async (input: {
  vehicleId: number;
  docType: DocType;
  fileUrl: string;
  fileName: string;
  expiryDate?: Date;
}) => {
  await getVehicleById(input.vehicleId);
  return prisma.vehicleDocument.create({ data: input });
};

export const deleteVehicleDocument = async (vehicleId: number, documentId: number) => {
  const document = await prisma.vehicleDocument.findFirst({ where: { id: documentId, vehicleId } });
  if (!document) throw new ApiError(404, "document", "Vehicle document not found");
  await prisma.vehicleDocument.delete({ where: { id: documentId } });
  return document;
};

export const getVehicleServiceStatus = async (id: number) => {
  const vehicle = await prisma.vehicle.findUnique({ where: { id } });
  if (!vehicle) throw new ApiError(404, "vehicle", "Vehicle not found");
  if (!vehicle.serviceIntervalKm || vehicle.lastServiceOdometerKm === null) {
    return { dueInKm: null, isOverdue: false, isDueSoon: false, configured: false };
  }
  const dueInKm = vehicle.serviceIntervalKm - (Number(vehicle.odometerKm) - Number(vehicle.lastServiceOdometerKm));
  return { dueInKm, isOverdue: dueInKm < 0, isDueSoon: dueInKm >= 0 && dueInKm <= vehicle.serviceIntervalKm * 0.1, configured: true };
};

export const bulkUpdateVehicleStatus = async (ids: number[], status: VehicleStatus) => {
  const vehicles = await prisma.vehicle.findMany({ where: { id: { in: ids } }, select: { id: true, status: true } });
  const found = new Map(vehicles.map((vehicle) => [vehicle.id, vehicle]));
  return Promise.all(ids.map(async (id) => {
    const vehicle = found.get(id);
    if (!vehicle) return { id, success: false, field: "vehicle", message: "Vehicle not found" };
    try {
      assertVehicleStatusTransition(vehicle.status, status);
      await prisma.vehicle.update({ where: { id }, data: { status } });
      return { id, success: true };
    } catch (error) {
      return { id, success: false, field: error instanceof ApiError ? error.field : "status", message: error instanceof Error ? error.message : "Unable to update vehicle" };
    }
  }));
};

export const deleteVehicle = async (id: number) => {
  try {
    await prisma.vehicle.delete({ where: { id } });
  } catch (error) {
    handlePrismaVehicleError(error);
  }
};

