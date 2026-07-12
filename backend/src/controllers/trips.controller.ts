import type { Request, Response } from "express";
import { z } from "zod";

import {
  createTrip,
  createTripSchema,
  listTrips,
  getTripById,
} from "../services/trips.service.js";
import { cancelTrip, completeTrip, dispatchTrip } from "../services/tripLifecycle.js";
import { ApiError } from "../utils/apiError.js";
import { parsePagination } from "../utils/pagination.js";

const tripIdParamSchema = z.object({
  tripId: z.coerce.number().int().positive("Trip id must be a positive integer"),
});

const completeTripSchema = z.object({
  finalOdometerKm: z.coerce.number().nonnegative("Final odometer cannot be negative"),
  fuelConsumedLiters: z.coerce.number().nonnegative("Fuel consumed cannot be negative"),
});

const parseTripId = (params: unknown) => tripIdParamSchema.parse(params).tripId;

const getActorId = (req: Request) => {
  const actorId = Number(req.user?.id);

  if (!Number.isInteger(actorId) || actorId <= 0) {
    throw new ApiError(401, "auth", "Authenticated user id is invalid");
  }

  return actorId;
};

export const getTripsController = async (req: Request, res: Response) => {
  const pagination = parsePagination(req.query);
  const trips = await listTrips(pagination);
  res.json(trips);
};

export const getTripByIdController = async (req: Request, res: Response) => {
  const tripId = parseTripId(req.params);
  const trip = await getTripById(tripId);
  res.json({ data: trip });
};

export const createTripController = async (req: Request, res: Response) => {
  const payload = createTripSchema.parse(req.body);
  const trip = await createTrip({
    ...payload,
    createdById: getActorId(req),
  });

  res.status(201).json({ data: trip });
};

export const dispatchTripController = async (req: Request, res: Response) => {
  const tripId = parseTripId(req.params);
  const trip = await dispatchTrip(tripId);
  res.json({ data: trip });
};

export const completeTripController = async (req: Request, res: Response) => {
  const tripId = parseTripId(req.params);
  const payload = completeTripSchema.parse(req.body);
  const trip = await completeTrip(tripId, payload);
  res.json({ data: trip });
};

export const cancelTripController = async (req: Request, res: Response) => {
  const tripId = parseTripId(req.params);
  const trip = await cancelTrip(tripId);
  res.json({ data: trip });
};

