import type { Request, Response } from "express";
import { z } from "zod";

import {
  createExpense,
  createExpenseSchema,
  createFuelLog,
  createFuelLogSchema,
  getVehicleCostSummary,
  listExpenses,
  listFuelLogs,
} from "../services/finance.service.js";
import { parsePagination } from "../utils/pagination.js";

const financeQuerySchema = z.object({
  vehicleId: z.coerce.number().int().positive().optional(),
});

const vehicleIdParamSchema = z.object({
  vehicleId: z.coerce.number().int().positive("Vehicle id must be a positive integer"),
});

export const getFuelLogsController = async (req: Request, res: Response) => {
  const pagination = parsePagination(req.query);
  const { vehicleId } = financeQuerySchema.parse(req.query);
  const fuelLogs = await listFuelLogs(pagination, vehicleId);
  res.json(fuelLogs);
};

export const createFuelLogController = async (req: Request, res: Response) => {
  const payload = createFuelLogSchema.parse(req.body);
  const fuelLog = await createFuelLog(payload);
  res.status(201).json({ data: fuelLog });
};

export const getExpensesController = async (req: Request, res: Response) => {
  const pagination = parsePagination(req.query);
  const { vehicleId } = financeQuerySchema.parse(req.query);
  const expenses = await listExpenses(pagination, vehicleId);
  res.json(expenses);
};

export const createExpenseController = async (req: Request, res: Response) => {
  const payload = createExpenseSchema.parse(req.body);
  const expense = await createExpense(payload);
  res.status(201).json({ data: expense });
};

export const getVehicleCostSummaryController = async (req: Request, res: Response) => {
  const { vehicleId } = vehicleIdParamSchema.parse(req.params);
  const summary = await getVehicleCostSummary(vehicleId);
  res.json({ data: summary });
};

