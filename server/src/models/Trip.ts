import { Schema, model } from "mongoose";
import { tripStatuses } from "../types/domain.js";

const tripSchema = new Schema(
  {
    source: { type: String, required: true, trim: true },
    destination: { type: String, required: true, trim: true },
    vehicle: { type: Schema.Types.ObjectId, ref: "Vehicle", required: true },
    driver: { type: Schema.Types.ObjectId, ref: "Driver", required: true },
    cargoWeightKg: { type: Number, required: true, min: 0 },
    plannedDistanceKm: { type: Number, required: true, min: 0 },
    finalOdometerKm: { type: Number, min: 0 },
    fuelConsumedLiters: { type: Number, min: 0 },
    status: { type: String, enum: tripStatuses, default: "Draft" },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" }
  },
  { timestamps: true }
);

tripSchema.index({ status: 1 });
tripSchema.index({ vehicle: 1 });
tripSchema.index({ driver: 1 });

export const Trip = model("Trip", tripSchema);

