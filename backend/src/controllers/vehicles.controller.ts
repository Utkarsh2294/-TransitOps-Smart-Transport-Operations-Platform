import type { Request, Response } from "express";
import { z } from "zod";

import {
  createVehicle,
  createVehicleSchema,
  deleteVehicle,
  getVehicleById,
  listAvailableVehicles,
  listVehicles,
  updateVehicle,
  updateVehicleSchema,
} from "../services/vehicles.service.js";
import { ApiError } from "../utils/apiError.js";
import { parsePagination } from "../utils/pagination.js";

const vehicleIdParamSchema = z.object({
  id: z.coerce.number().int().positive("Vehicle id must be a positive integer"),
});

const parseVehicleId = (params: unknown) => vehicleIdParamSchema.parse(params).id;

export const getVehiclesController = async (req: Request, res: Response) => {
  const pagination = parsePagination(req.query);
  const vehicles = await listVehicles(pagination);
  res.json(vehicles);
};

export const getAvailableVehiclesController = async (_req: Request, res: Response) => {
  const vehicles = await listAvailableVehicles();
  res.json({ data: vehicles });
};

export const getVehicleController = async (req: Request, res: Response) => {
  const id = parseVehicleId(req.params);
  const vehicle = await getVehicleById(id);
  res.json({ data: vehicle });
};

export const createVehicleController = async (req: Request, res: Response) => {
  const payload = createVehicleSchema.parse(req.body);
  const vehicle = await createVehicle(payload);
  res.status(201).json({ data: vehicle });
};

export const updateVehicleController = async (req: Request, res: Response) => {
  const id = parseVehicleId(req.params);
  const payload = updateVehicleSchema.parse(req.body);

  if ("status" in payload && req.user?.role !== "fleet_manager") {
    throw new ApiError(403, "status", "Only a fleet manager can change vehicle status");
  }

  const vehicle = await updateVehicle(id, payload);
  res.json({ data: vehicle });
};

export const deleteVehicleController = async (req: Request, res: Response) => {
  const id = parseVehicleId(req.params);
  await deleteVehicle(id);
  res.status(204).send();
};
