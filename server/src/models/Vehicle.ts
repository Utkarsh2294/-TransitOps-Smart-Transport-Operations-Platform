import { Schema, model } from "mongoose";
import { vehicleStatuses } from "../types/domain.js";

const vehicleSchema = new Schema(
  {
    regNumber: { type: String, required: true, unique: true, uppercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    type: { type: String, required: true, trim: true },
    maxLoadCapacityKg: { type: Number, required: true, min: 1 },
    odometerKm: { type: Number, required: true, default: 0, min: 0 },
    acquisitionCost: { type: Number, required: true, min: 0 },
    status: { type: String, enum: vehicleStatuses, default: "Available" }
  },
  { timestamps: true }
);

vehicleSchema.index({ status: 1 });
vehicleSchema.index({ type: 1 });

export const Vehicle = model("Vehicle", vehicleSchema);

