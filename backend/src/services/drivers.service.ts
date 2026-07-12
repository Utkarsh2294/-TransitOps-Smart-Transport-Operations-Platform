import { DriverStatus, Prisma } from "@prisma/client";
import { z } from "zod";

import { prisma } from "../config/prisma.js";
import { ApiError } from "../utils/apiError.js";
import type { Pagination } from "../utils/pagination.js";

const driverStatusSchema = z.nativeEnum(DriverStatus);

const phoneSchema = z
  .string()
  .trim()
  .regex(/^[+()\-\s0-9]{8,20}$/, "Contact number must be 8-20 digits or phone symbols");

const driverBaseSchema = z.object({
  name: z.string().trim().min(1, "Driver name is required"),
  licenseNumber: z.string().trim().min(1, "License number is required"),
  licenseCategory: z.string().trim().min(1, "License category is required"),
  licenseExpiryDate: z.coerce.date({
    invalid_type_error: "License expiry date must be a valid date",
  }),
  contactNumber: phoneSchema,
  safetyScore: z.coerce
    .number()
    .int("Safety score must be a whole number")
    .min(0, "Safety score cannot be below 0")
    .max(100, "Safety score cannot exceed 100")
    .default(100),
  status: driverStatusSchema.default(DriverStatus.Available),
});

export const createDriverSchema = driverBaseSchema;

export const updateDriverSchema = driverBaseSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  {
    message: "At least one driver field is required",
  },
);

const handlePrismaDriverError = (error: unknown): never => {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      throw new ApiError(409, "licenseNumber", "A driver with this license number already exists");
    }

    if (error.code === "P2025") {
      throw new ApiError(404, "driver", "Driver not found");
    }
  }

  throw error;
};

export const listDrivers = async ({ limit, page, skip }: Pagination) => {
  const [total, drivers] = await prisma.$transaction([
    prisma.driver.count(),
    prisma.driver.findMany({
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
  ]);

  return {
    data: drivers,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const listAvailableDrivers = async () => {
  return prisma.driver.findMany({
    where: {
      status: DriverStatus.Available,
      licenseExpiryDate: {
        gt: new Date(),
      },
    },
    orderBy: { name: "asc" },
    take: 100,
  });
};

export const getDriverById = async (id: number) => {
  const driver = await prisma.driver.findUnique({ where: { id } });

  if (!driver) {
    throw new ApiError(404, "driver", "Driver not found");
  }

  return driver;
};

export const createDriver = async (input: z.infer<typeof createDriverSchema>) => {
  try {
    return await prisma.driver.create({ data: input });
  } catch (error) {
    handlePrismaDriverError(error);
  }
};

export const updateDriver = async (id: number, input: z.infer<typeof updateDriverSchema>) => {
  try {
    return await prisma.driver.update({
      where: { id },
      data: input,
    });
  } catch (error) {
    handlePrismaDriverError(error);
  }
};

export const bulkUpdateDriverStatus = async (ids: number[], status: DriverStatus) => {
  const drivers = await prisma.driver.findMany({ where: { id: { in: ids } }, select: { id: true } });
  const foundIds = new Set(drivers.map((driver) => driver.id));
  return Promise.all(ids.map(async (id) => {
    if (!foundIds.has(id)) return { id, success: false, field: "driver", message: "Driver not found" };
    try {
      await prisma.driver.update({ where: { id }, data: { status } });
      return { id, success: true };
    } catch (error) {
      return { id, success: false, field: "status", message: error instanceof Error ? error.message : "Unable to update driver" };
    }
  }));
};

export const createSafetyEventSchema = z.object({
  score: z.coerce.number().int().min(0, "Safety score cannot be below 0").max(100, "Safety score cannot exceed 100"),
  reason: z.string().trim().max(240).optional(),
});

export const createSafetyEvent = async (driverId: number, input: z.infer<typeof createSafetyEventSchema>) => {
  const driver = await prisma.driver.findUnique({ where: { id: driverId }, select: { id: true } });
  if (!driver) throw new ApiError(404, "driver", "Driver not found");
  const event = await prisma.safetyScoreEvent.create({ data: { driverId, ...input } });
  await prisma.driver.update({ where: { id: driverId }, data: { safetyScore: input.score } });
  return event;
};

export const getSafetyHistory = async (driverId: number) => {
  await getDriverById(driverId);
  return prisma.safetyScoreEvent.findMany({ where: { driverId }, orderBy: { recordedAt: "asc" } });
};

export const unsuspendDriver = async (id: number) => {
  try {
    const driver = await prisma.driver.findUnique({ where: { id } });

    if (!driver) {
      throw new ApiError(404, "driver", "Driver not found");
    }

    if (driver.status !== DriverStatus.Suspended) {
      throw new ApiError(400, "status", "Only suspended drivers can be unsuspended");
    }

    const nextStatus = driver.licenseExpiryDate > new Date()
      ? DriverStatus.Available
      : DriverStatus.Off_Duty;

    return prisma.driver.update({
      where: { id },
      data: { status: nextStatus },
    });
  } catch (error) {
    handlePrismaDriverError(error);
  }
};

export const deleteDriver = async (id: number) => {
  try {
    await prisma.driver.delete({ where: { id } });
  } catch (error) {
    handlePrismaDriverError(error);
  }
};

