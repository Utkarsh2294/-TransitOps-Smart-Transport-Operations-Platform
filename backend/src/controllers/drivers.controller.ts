import type { Request, Response } from "express";
import { z } from "zod";

import {
  createDriver,
  createDriverSchema,
  deleteDriver,
  getDriverById,
  listAvailableDrivers,
  listDrivers,
  updateDriver,
  updateDriverSchema,
} from "../services/drivers.service.js";
import { ApiError } from "../utils/apiError.js";
import { parsePagination } from "../utils/pagination.js";

const driverIdParamSchema = z.object({
  id: z.coerce.number().int().positive("Driver id must be a positive integer"),
});

const parseDriverId = (params: unknown) => driverIdParamSchema.parse(params).id;

export const getDriversController = async (req: Request, res: Response) => {
  const pagination = parsePagination(req.query);
  const drivers = await listDrivers(pagination);
  res.json(drivers);
};

export const getAvailableDriversController = async (_req: Request, res: Response) => {
  const drivers = await listAvailableDrivers();
  res.json({ data: drivers });
};

export const getDriverController = async (req: Request, res: Response) => {
  const id = parseDriverId(req.params);
  const driver = await getDriverById(id);
  res.json({ data: driver });
};

export const createDriverController = async (req: Request, res: Response) => {
  const payload = createDriverSchema.parse(req.body);
  const driver = await createDriver(payload);
  res.status(201).json({ data: driver });
};

export const updateDriverController = async (req: Request, res: Response) => {
  const id = parseDriverId(req.params);
  const payload = updateDriverSchema.parse(req.body);

  if ("status" in payload && req.user?.role !== "fleet_manager") {
    throw new ApiError(403, "status", "Only a fleet manager can change driver status");
  }

  const driver = await updateDriver(id, payload);
  res.json({ data: driver });
};

export const deleteDriverController = async (req: Request, res: Response) => {
  const id = parseDriverId(req.params);
  await deleteDriver(id);
  res.status(204).send();
};

