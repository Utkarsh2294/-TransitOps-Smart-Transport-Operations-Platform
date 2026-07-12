import type { Request, Response } from "express";
import { z } from "zod";

import {
  bulkUpdateVehicleStatus,
  createVehicleDocument,
  createVehicle,
  createVehicleSchema,
  deleteVehicle,
  getVehicleById,
  getVehicleServiceStatus,
  listAvailableVehicles,
  listVehicles,
  listVehicleDocuments,
  updateVehicle,
  updateVehicleSchema,
  deleteVehicleDocument,
  updateVehicleBudget,
  getVehicleFuelEfficiencyHistory,
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

const documentParamSchema = z.object({ id: z.coerce.number().int().positive(), docId: z.coerce.number().int().positive() });
const documentBodySchema = z.object({ docType: z.enum(["RC", "Insurance", "PUC", "Permit", "Other"]), expiryDate: z.coerce.date().optional() });
const bulkStatusSchema = z.object({ ids: z.array(z.coerce.number().int().positive()).min(1).max(100), status: z.enum(["Available", "On_Trip", "In_Shop", "Retired"]) });

export const getVehicleDocumentsController = async (req: Request, res: Response) => {
  const id = parseVehicleId(req.params);
  res.json({ data: await listVehicleDocuments(id) });
};

export const uploadVehicleDocumentController = async (req: Request, res: Response) => {
  const id = parseVehicleId(req.params);
  const payload = documentBodySchema.parse(req.body);
  if (!req.file) throw new ApiError(400, "file", "A PDF, JPG, or PNG document is required");
  const document = await createVehicleDocument({ vehicleId: id, docType: payload.docType, expiryDate: payload.expiryDate, fileName: req.file.originalname, fileUrl: `/uploads/${req.file.filename}` });
  res.status(201).json({ data: document });
};

export const deleteVehicleDocumentController = async (req: Request, res: Response) => {
  const { id, docId } = documentParamSchema.parse(req.params);
  await deleteVehicleDocument(id, docId);
  res.status(204).send();
};

export const getVehicleServiceStatusController = async (req: Request, res: Response) => {
  const id = parseVehicleId(req.params);
  res.json({ data: await getVehicleServiceStatus(id) });
};

export const bulkUpdateVehicleStatusController = async (req: Request, res: Response) => {
  const payload = bulkStatusSchema.parse(req.body);
  res.json({ data: await bulkUpdateVehicleStatus(payload.ids, payload.status) });
};

const budgetSchema = z.object({ monthlyBudget: z.coerce.number().positive() });

export const updateVehicleBudgetController = async (req: Request, res: Response) => {
  const id = parseVehicleId(req.params);
  const { monthlyBudget } = budgetSchema.parse(req.body);
  res.json({ data: await updateVehicleBudget(id, monthlyBudget) });
};

export const getVehicleFuelEfficiencyHistoryController = async (req: Request, res: Response) => {
  const id = parseVehicleId(req.params);
  res.json({ data: await getVehicleFuelEfficiencyHistory(id) });
};

