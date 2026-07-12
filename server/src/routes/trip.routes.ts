import { Router } from "express";
import { z } from "zod";
import { Driver } from "../models/Driver.js";
import { Trip } from "../models/Trip.js";
import { Vehicle } from "../models/Vehicle.js";
import { TripRuleError, validateDraftTrip } from "../services/tripRules.js";

const createTripSchema = z.object({
  source: z.string().trim().min(2),
  destination: z.string().trim().min(2),
  vehicleId: z.string().min(1),
  driverId: z.string().min(1),
  cargoWeightKg: z.number().nonnegative(),
  plannedDistanceKm: z.number().nonnegative()
});

export const tripRouter = Router();

tripRouter.post("/", async (req, res, next) => {
  try {
    const payload = createTripSchema.parse(req.body);
    const [vehicle, driver] = await Promise.all([
      Vehicle.findById(payload.vehicleId).lean(),
      Driver.findById(payload.driverId).lean()
    ]);

    if (!vehicle) {
      return res.status(404).json({ message: "Vehicle not found." });
    }

    if (!driver) {
      return res.status(404).json({ message: "Driver not found." });
    }

    validateDraftTrip({
      vehicle,
      driver,
      cargoWeightKg: payload.cargoWeightKg
    });

    const trip = await Trip.create({
      source: payload.source,
      destination: payload.destination,
      vehicle: payload.vehicleId,
      driver: payload.driverId,
      cargoWeightKg: payload.cargoWeightKg,
      plannedDistanceKm: payload.plannedDistanceKm,
      status: "Draft"
    });

    return res.status(201).json({ trip });
  } catch (error) {
    if (error instanceof TripRuleError) {
      return res.status(422).json({ message: error.message });
    }

    return next(error);
  }
});

