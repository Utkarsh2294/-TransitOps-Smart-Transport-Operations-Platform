import type { Request, Response } from "express";
import { z } from "zod";

import {
  closeMaintenance,
  createMaintenanceSchema,
  listMaintenance,
  openMaintenance,
} from "../services/maintenance.service.js";
import { parsePagination } from "../utils/pagination.js";

const maintenanceIdParamSchema = z.object({
  id: z.coerce.number().int().positive("Maintenance id must be a positive integer"),
});

const maintenanceQuerySchema = z.object({
  vehicleId: z.coerce.number().int().positive().optional(),
});

export const getMaintenanceController = async (req: Request, res: Response) => {
  const pagination = parsePagination(req.query);
  const { vehicleId } = maintenanceQuerySchema.parse(req.query);
  const maintenance = await listMaintenance(pagination, vehicleId);
  res.json(maintenance);
};

export const openMaintenanceController = async (req: Request, res: Response) => {
  const payload = createMaintenanceSchema.parse(req.body);
  const maintenance = await openMaintenance(payload);
  res.status(201).json({ data: maintenance });
};

export const closeMaintenanceController = async (req: Request, res: Response) => {
  const { id } = maintenanceIdParamSchema.parse(req.params);
  const maintenance = await closeMaintenance(id);
  res.json({ data: maintenance });
};

