import { Schema, model } from "mongoose";
import { driverStatuses } from "../types/domain.js";

const driverSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    licenseNumber: { type: String, required: true, unique: true, trim: true },
    licenseCategory: { type: String, required: true, trim: true },
    licenseExpiryDate: { type: Date, required: true },
    contactNumber: { type: String, required: true, trim: true },
    safetyScore: { type: Number, default: 100, min: 0, max: 100 },
    status: { type: String, enum: driverStatuses, default: "Available" }
  },
  { timestamps: true }
);

driverSchema.index({ status: 1 });
driverSchema.index({ licenseExpiryDate: 1 });

export const Driver = model("Driver", driverSchema);

