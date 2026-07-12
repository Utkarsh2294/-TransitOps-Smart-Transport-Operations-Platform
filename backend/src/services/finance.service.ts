import { ExpenseCategory, Prisma } from "@prisma/client";
import { z } from "zod";

import { prisma } from "../config/prisma.js";
import { ApiError } from "../utils/apiError.js";
import type { Pagination } from "../utils/pagination.js";

export const createFuelLogSchema = z.object({
  vehicleId: z.coerce.number().int().positive("Vehicle is required"),
  tripId: z.coerce.number().int().positive("Trip id must be a positive integer").optional(),
  liters: z.coerce.number().positive("Fuel liters must be greater than zero"),
  cost: z.coerce.number().nonnegative("Fuel cost cannot be negative"),
  date: z.coerce.date().default(() => new Date()),
});

export const createExpenseSchema = z.object({
  vehicleId: z.coerce.number().int().positive("Vehicle is required"),
  category: z.nativeEnum(ExpenseCategory),
  amount: z.coerce.number().nonnegative("Expense amount cannot be negative"),
  date: z.coerce.date().default(() => new Date()),
  note: z.string().trim().max(500, "Note cannot exceed 500 characters").optional(),
});

const serializeFuelLog = (fuelLog: {
  id: number;
  vehicleId: number;
  tripId: number | null;
  liters: Prisma.Decimal;
  cost: Prisma.Decimal;
  date: Date;
}) => ({
  ...fuelLog,
  liters: Number(fuelLog.liters),
  cost: Number(fuelLog.cost),
});

const serializeExpense = (expense: {
  id: number;
  vehicleId: number;
  category: ExpenseCategory;
  amount: Prisma.Decimal;
  date: Date;
  note: string | null;
}) => ({
  ...expense,
  amount: Number(expense.amount),
});

const getVehicleOrThrow = async (vehicleId: number) => {
  const vehicle = await prisma.vehicle.findUnique({
    where: { id: vehicleId },
    select: { id: true },
  });

  if (!vehicle) {
    throw new ApiError(404, "vehicleId", "Vehicle not found");
  }

  return vehicle;
};

export const listFuelLogs = async ({ limit, page, skip }: Pagination, vehicleId?: number) => {
  const where = vehicleId ? { vehicleId } : undefined;
  const [total, fuelLogs] = await prisma.$transaction([
    prisma.fuelLog.count({ where }),
    prisma.fuelLog.findMany({
      where,
      orderBy: { date: "desc" },
      skip,
      take: limit,
    }),
  ]);

  return {
    data: fuelLogs.map(serializeFuelLog),
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const createFuelLog = async (input: z.infer<typeof createFuelLogSchema>) => {
  await getVehicleOrThrow(input.vehicleId);

  if (input.tripId) {
    const trip = await prisma.trip.findUnique({
      where: { id: input.tripId },
      select: { vehicleId: true },
    });

    if (!trip) {
      throw new ApiError(404, "tripId", "Trip not found");
    }

    if (trip.vehicleId !== input.vehicleId) {
      throw new ApiError(422, "tripId", "Trip must belong to the selected vehicle");
    }
  }

  const fuelLog = await prisma.fuelLog.create({
    data: {
      vehicleId: input.vehicleId,
      tripId: input.tripId,
      liters: new Prisma.Decimal(input.liters),
      cost: new Prisma.Decimal(input.cost),
      date: input.date,
    },
  });

  return serializeFuelLog(fuelLog);
};

export const listExpenses = async ({ limit, page, skip }: Pagination, vehicleId?: number) => {
  const where = vehicleId ? { vehicleId } : undefined;
  const [total, expenses] = await prisma.$transaction([
    prisma.expense.count({ where }),
    prisma.expense.findMany({
      where,
      orderBy: { date: "desc" },
      skip,
      take: limit,
    }),
  ]);

  return {
    data: expenses.map(serializeExpense),
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const createExpense = async (input: z.infer<typeof createExpenseSchema>) => {
  await getVehicleOrThrow(input.vehicleId);

  const expense = await prisma.expense.create({
    data: {
      vehicleId: input.vehicleId,
      category: input.category,
      amount: new Prisma.Decimal(input.amount),
      date: input.date,
      note: input.note,
    },
  });

  return serializeExpense(expense);
};

export const getVehicleCostSummary = async (vehicleId: number) => {
  await getVehicleOrThrow(vehicleId);

  const [fuel, maintenance, expenses] = await prisma.$transaction([
    prisma.fuelLog.aggregate({
      where: { vehicleId },
      _sum: { cost: true, liters: true },
    }),
    prisma.maintenanceLog.aggregate({
      where: { vehicleId },
      _sum: { cost: true },
    }),
    prisma.expense.aggregate({
      where: { vehicleId },
      _sum: { amount: true },
    }),
  ]);

  const fuelCost = Number(fuel._sum.cost ?? 0);
  const maintenanceCost = Number(maintenance._sum.cost ?? 0);
  const expenseCost = Number(expenses._sum.amount ?? 0);

  return {
    vehicleId,
    fuelLiters: Number(fuel._sum.liters ?? 0),
    fuelCost,
    maintenanceCost,
    expenseCost,
    totalOperationalCost: fuelCost + maintenanceCost + expenseCost,
  };
};

