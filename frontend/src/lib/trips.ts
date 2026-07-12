import { apiRequest } from "./api";
import type { CompleteTripFormValues, Trip, TripFormValues, TripListResponse, TripResponse } from "../types/trip";

const toTripPayload = (values: TripFormValues) => ({
  source: values.source,
  destination: values.destination,
  vehicleId: Number(values.vehicleId),
  driverId: Number(values.driverId),
  cargoWeightKg: Number(values.cargoWeightKg),
  plannedDistanceKm: Number(values.plannedDistanceKm),
});

const toCompletePayload = (values: CompleteTripFormValues) => ({
  finalOdometerKm: Number(values.finalOdometerKm),
  fuelConsumedLiters: Number(values.fuelConsumedLiters),
});

export const getTrips = (page = 1, limit = 20) =>
  apiRequest<TripListResponse>(`/trips?page=${page}&limit=${limit}`);

export const createTrip = (values: TripFormValues) =>
  apiRequest<TripResponse>("/trips", {
    method: "POST",
    body: JSON.stringify(toTripPayload(values)),
  });

export const dispatchTrip = (trip: Trip) =>
  apiRequest<TripResponse>(`/trips/${trip.id}/dispatch`, {
    method: "POST",
  });

export const completeTrip = (trip: Trip, values: CompleteTripFormValues) =>
  apiRequest<TripResponse>(`/trips/${trip.id}/complete`, {
    method: "POST",
    body: JSON.stringify(toCompletePayload(values)),
  });

export const cancelTrip = (trip: Trip) =>
  apiRequest<TripResponse>(`/trips/${trip.id}/cancel`, {
    method: "POST",
  });

