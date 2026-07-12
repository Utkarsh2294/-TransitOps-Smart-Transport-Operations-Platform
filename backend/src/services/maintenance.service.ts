import { MaintenanceStatus, Prisma, VehicleStatus } from "@prisma/client";
import { z } from "zod";

import { prisma } from "../config/prisma.js";
import { ApiError } from "../utils/apiError.js";
import type { Pagination } from "../utils/pagination.js";

export const createMaintenanceSchema = z.object({
  vehicleId: z.coerce.number().int().positive("Vehicle is required"),
  type: z.string().trim().min(1, "Maintenance type is required"),
  cost: z.coerce.number().nonnegative("Maintenance cost cannot be negative"),
});

const serializeMaintenance = (maintenance: {
  id: number;
  vehicleId: number;
  type: string;
  cost: Prisma.Decimal;
  status: MaintenanceStatus;
  openedAt: Date;
  closedAt: Date | null;
  vehicle?: {
    id: number;
    regNumber: string;
    name: string;
    status: VehicleStatus;
  };
}) => ({
  ...maintenance,
  cost: Number(maintenance.cost),
});

const handlePrismaMaintenanceError = (error: unknown): never => {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2025") {
      throw new ApiError(404, "maintenance", "Maintenance record not found");
    }
  }

  throw error;
};

export const listMaintenance = async (
  { limit, page, skip }: Pagination,
  vehicleId?: number,
) => {
  const where = vehicleId ? { vehicleId } : undefined;
  const [total, maintenance] = await prisma.$transaction([
    prisma.maintenanceLog.count({ where }),
    prisma.maintenanceLog.findMany({
      where,
      include: {
        vehicle: {
          select: {
            id: true,
            regNumber: true,
            name: true,
            status: true,
          },
        },
      },
      orderBy: { openedAt: "desc" },
      skip,
      take: limit,
    }),
  ]);

  return {
    data: maintenance.map(serializeMaintenance),
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const openMaintenance = async (input: z.infer<typeof createMaintenanceSchema>) => {
  try {
    return await prisma.$transaction(async (tx) => {
      const vehicle = await tx.vehicle.findUnique({ where: { id: input.vehicleId } });

      if (!vehicle) {
        throw new ApiError(404, "vehicleId", "Vehicle not found");
      }

      if (vehicle.status === VehicleStatus.Retired) {
        throw new ApiError(400, "vehicleId", "Retired vehicles cannot be sent to maintenance");
      }

      const maintenance = await tx.maintenanceLog.create({
        data: {
          vehicleId: input.vehicleId,
          type: input.type,
          cost: new Prisma.Decimal(input.cost),
          status: MaintenanceStatus.Open,
        },
      });

      await tx.vehicle.update({
        where: { id: input.vehicleId },
        data: { status: VehicleStatus.In_Shop },
      });

      const opened = await tx.maintenanceLog.findUniqueOrThrow({
        where: { id: maintenance.id },
        include: {
          vehicle: {
            select: {
              id: true,
              regNumber: true,
              name: true,
              status: true,
            },
          },
        },
      });

      return serializeMaintenance(opened);
    });
  } catch (error) {
    handlePrismaMaintenanceError(error);
  }
};

export const closeMaintenance = async (id: number) => {
  try {
    return await prisma.$transaction(async (tx) => {
      const maintenance = await tx.maintenanceLog.findUnique({
        where: { id },
        include: { vehicle: true },
      });

      if (!maintenance) {
        throw new ApiError(404, "maintenance", "Maintenance record not found");
      }

      if (maintenance.status === MaintenanceStatus.Closed) {
        throw new ApiError(400, "status", "Maintenance record is already closed");
      }

      await tx.maintenanceLog.update({
        where: { id },
        data: {
          status: MaintenanceStatus.Closed,
          closedAt: new Date(),
        },
      });

      if (maintenance.vehicle.status !== VehicleStatus.Retired) {
        await tx.vehicle.update({
          where: { id: maintenance.vehicleId },
          data: { status: VehicleStatus.Available },
        });
      }

      const closed = await tx.maintenanceLog.findUniqueOrThrow({
        where: { id },
        include: {
          vehicle: {
            select: {
              id: true,
              regNumber: true,
              name: true,
              status: true,
            },
          },
        },
      });

      return serializeMaintenance(closed);
    });
  } catch (error) {
    handlePrismaMaintenanceError(error);
  }
};
