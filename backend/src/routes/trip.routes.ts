import { Router } from "express";
import { z } from "zod";
import { cancelTrip, completeTrip, dispatchTrip } from "../services/tripLifecycle.js";

const tripIdSchema = z.coerce.number().int().positive();

const completeTripSchema = z.object({
  finalOdometerKm: z.number().nonnegative(),
  fuelConsumedLiters: z.number().nonnegative(),
});

export const tripRouter = Router();

tripRouter.post("/:tripId/dispatch", async (req, res, next) => {
  try {
    const tripId = tripIdSchema.parse(req.params.tripId);
    const trip = await dispatchTrip(tripId);

    return res.json({ trip });
  } catch (error) {
    return next(error);
  }
});

tripRouter.post("/:tripId/complete", async (req, res, next) => {
  try {
    const tripId = tripIdSchema.parse(req.params.tripId);
    const payload = completeTripSchema.parse(req.body);
    const trip = await completeTrip(tripId, payload);

    return res.json({ trip });
  } catch (error) {
    return next(error);
  }
});

tripRouter.post("/:tripId/cancel", async (req, res, next) => {
  try {
    const tripId = tripIdSchema.parse(req.params.tripId);
    const trip = await cancelTrip(tripId);

    return res.json({ trip });
  } catch (error) {
    return next(error);
  }
});
