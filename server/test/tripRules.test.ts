import { describe, expect, it } from "vitest";
import { TripRuleError, validateDraftTrip } from "../src/services/tripRules.js";
import type { DispatchDriverSnapshot, DispatchVehicleSnapshot } from "../src/types/domain.js";

const availableVehicle: DispatchVehicleSnapshot = {
  status: "Available",
  maxLoadCapacityKg: 500
};

const availableDriver: DispatchDriverSnapshot = {
  status: "Available",
  licenseExpiryDate: new Date("2026-12-31")
};

describe("validateDraftTrip", () => {
  it("allows a draft trip when vehicle, driver, license, and cargo are valid", () => {
    expect(() =>
      validateDraftTrip({
        vehicle: availableVehicle,
        driver: availableDriver,
        cargoWeightKg: 450,
        now: new Date("2026-07-12")
      })
    ).not.toThrow();
  });

  it("blocks vehicles that are not available", () => {
    expect(() =>
      validateDraftTrip({
        vehicle: { ...availableVehicle, status: "In Shop" },
        driver: availableDriver,
        cargoWeightKg: 100,
        now: new Date("2026-07-12")
      })
    ).toThrow(TripRuleError);
  });

  it("blocks drivers that are not available", () => {
    expect(() =>
      validateDraftTrip({
        vehicle: availableVehicle,
        driver: { ...availableDriver, status: "Suspended" },
        cargoWeightKg: 100,
        now: new Date("2026-07-12")
      })
    ).toThrow(TripRuleError);
  });

  it("blocks drivers with expired licenses", () => {
    expect(() =>
      validateDraftTrip({
        vehicle: availableVehicle,
        driver: { ...availableDriver, licenseExpiryDate: new Date("2026-01-01") },
        cargoWeightKg: 100,
        now: new Date("2026-07-12")
      })
    ).toThrow("Driver license is expired");
  });

  it("blocks overloaded cargo", () => {
    expect(() =>
      validateDraftTrip({
        vehicle: availableVehicle,
        driver: availableDriver,
        cargoWeightKg: 501,
        now: new Date("2026-07-12")
      })
    ).toThrow("Cargo weight exceeds");
  });
});

