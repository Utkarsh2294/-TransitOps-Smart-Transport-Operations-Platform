import { CheckCircle2, Play, Plus, RefreshCw, Route, XCircle } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";

import type { ApiErrorResponse } from "../../lib/api";
import { getDrivers } from "../../lib/drivers";
import { cancelTrip, completeTrip, createTrip, dispatchTrip, getTrips } from "../../lib/trips";
import { getVehicles } from "../../lib/vehicles";
import type { Driver } from "../../types/driver";
import type { CompleteTripFormValues, Trip, TripFormValues } from "../../types/trip";
import type { Vehicle } from "../../types/vehicle";
import { Button } from "../ui/Button";

const blankTripForm: TripFormValues = {
  source: "",
  destination: "",
  vehicleId: "",
  driverId: "",
  cargoWeightKg: "",
  plannedDistanceKm: "",
};

const blankCompleteForm: CompleteTripFormValues = {
  finalOdometerKm: "",
  fuelConsumedLiters: "",
};

const formatNumber = (value: number) =>
  new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(value);

const tripStatusClasses = {
  Draft: "border-slate-500/30 bg-slate-500/10 text-slate-300",
  Dispatched: "border-info/30 bg-info/10 text-blue-300",
  Completed: "border-success/30 bg-success/10 text-green-300",
  Cancelled: "border-danger/30 bg-danger/10 text-red-300",
};

const validateTrip = (values: TripFormValues) => {
  const errors: Partial<Record<keyof TripFormValues, string>> = {};

  if (!values.source.trim()) errors.source = "Source is required";
  if (!values.destination.trim()) errors.destination = "Destination is required";
  if (!values.vehicleId) errors.vehicleId = "Vehicle is required";
  if (!values.driverId) errors.driverId = "Driver is required";
  if (Number(values.cargoWeightKg) < 0 || !values.cargoWeightKg) {
    errors.cargoWeightKg = "Cargo weight is required";
  }
  if (Number(values.plannedDistanceKm) < 0 || !values.plannedDistanceKm) {
    errors.plannedDistanceKm = "Planned distance is required";
  }

  return errors;
};

type FieldProps = {
  error?: string;
  label: string;
  name: keyof TripFormValues;
  onChange: (name: keyof TripFormValues, value: string) => void;
  type?: string;
  value: string;
};

const Field = ({ error, label, name, onChange, type = "text", value }: FieldProps) => (
  <label className="block">
    <span className="text-xs font-medium uppercase tracking-wide text-muted">{label}</span>
    <input
      className="mt-2 h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none transition placeholder:text-slate-600 focus:border-primary"
      onChange={(event) => onChange(name, event.target.value)}
      type={type}
      value={value}
    />
    {error ? <span className="mt-1 block text-xs text-red-300">{error}</span> : null}
  </label>
);

const TripStatusBadge = ({ status }: { status: Trip["status"] }) => (
  <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${tripStatusClasses[status]}`}>
    {status}
  </span>
);

export const TripManagement = () => {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [tripValues, setTripValues] = useState<TripFormValues>(blankTripForm);
  const [completeValues, setCompleteValues] = useState<CompleteTripFormValues>(blankCompleteForm);
  const [errors, setErrors] = useState<Partial<Record<keyof TripFormValues, string>>>({});
  const [serverError, setServerError] = useState<ApiErrorResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const activeTrips = useMemo(
    () => trips.filter((trip) => trip.status === "Dispatched").length,
    [trips],
  );
  const draftTrips = useMemo(() => trips.filter((trip) => trip.status === "Draft").length, [trips]);

  const availableVehicles = useMemo(
    () => vehicles.filter((vehicle) => vehicle.status === "Available"),
    [vehicles],
  );
  const availableDrivers = useMemo(
    () => drivers.filter((driver) => driver.status === "Available"),
    [drivers],
  );

  const loadData = async () => {
    setIsLoading(true);
    setServerError(null);

    try {
      const [tripResponse, vehicleResponse, driverResponse] = await Promise.all([
        getTrips(),
        getVehicles(1),
        getDrivers(1, 100),
      ]);
      setTrips(tripResponse.data);
      setVehicles(vehicleResponse.data);
      setDrivers(driverResponse.data);
      if (selectedTrip) {
        setSelectedTrip(tripResponse.data.find((trip) => trip.id === selectedTrip.id) ?? null);
      }
    } catch (error) {
      setServerError(error as ApiErrorResponse);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const handleTripFieldChange = (name: keyof TripFormValues, value: string) => {
    setTripValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
    setServerError(null);
  };

  const handleCreateTrip = async (event: FormEvent) => {
    event.preventDefault();
    const nextErrors = validateTrip(tripValues);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) return;

    setIsSaving(true);
    setServerError(null);

    try {
      const response = await createTrip(tripValues);
      setSelectedTrip(response.data);
      setTripValues(blankTripForm);
      await loadData();
    } catch (error) {
      setServerError(error as ApiErrorResponse);
    } finally {
      setIsSaving(false);
    }
  };

  const runTripAction = async (action: () => Promise<unknown>) => {
    setIsSaving(true);
    setServerError(null);

    try {
      await action();
      setCompleteValues(blankCompleteForm);
      await loadData();
    } catch (error) {
      setServerError(error as ApiErrorResponse);
    } finally {
      setIsSaving(false);
    }
  };

  const getVehicleLabel = (vehicleId: number) => {
    const vehicle = vehicles.find((item) => item.id === vehicleId);
    return vehicle ? `${vehicle.regNumber} · ${vehicle.name}` : `Vehicle #${vehicleId}`;
  };

  const getDriverLabel = (driverId: number) => {
    const driver = drivers.find((item) => item.id === driverId);
    return driver ? driver.name : `Driver #${driverId}`;
  };

  return (
    <section className="mx-auto max-w-7xl px-4 py-6 lg:px-8">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm text-muted">Operations</p>
          <h2 className="mt-1 text-2xl font-semibold">Trip Management</h2>
        </div>
        <Button onClick={() => void loadData()} type="button" variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-4">
        <div className="rounded-lg border border-border bg-surface p-5 shadow-glow">
          <p className="text-sm text-muted">Total Trips</p>
          <p className="mt-2 text-3xl font-semibold">{trips.length}</p>
        </div>
        <div className="rounded-lg border border-border bg-surface p-5">
          <p className="text-sm text-muted">Active Trips</p>
          <p className="mt-2 text-3xl font-semibold">{activeTrips}</p>
        </div>
        <div className="rounded-lg border border-border bg-surface p-5">
          <p className="text-sm text-muted">Draft Trips</p>
          <p className="mt-2 text-3xl font-semibold">{draftTrips}</p>
        </div>
        <div className="rounded-lg border border-border bg-surface p-5">
          <p className="text-sm text-muted">Available Capacity</p>
          <p className="mt-2 text-3xl font-semibold">{availableVehicles.length}</p>
        </div>
      </div>

      {serverError ? (
        <div className="mb-6 rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-red-200">
          {serverError.message}
        </div>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="overflow-hidden rounded-lg border border-border bg-surface">
          <div className="border-b border-border px-5 py-4">
            <h3 className="text-base font-semibold">Trips</h3>
          </div>

          {isLoading ? (
            <div className="space-y-3 p-5">
              {Array.from({ length: 5 }).map((_, index) => (
                <div className="h-12 animate-pulse rounded-md bg-panel" key={index} />
              ))}
            </div>
          ) : trips.length === 0 ? (
            <div className="p-10 text-center">
              <p className="text-lg font-semibold">No trips created yet</p>
              <p className="mt-2 text-sm text-muted">Create a draft trip to start dispatch operations.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] border-collapse text-left text-sm">
                <thead className="bg-panel text-xs uppercase tracking-wide text-muted">
                  <tr>
                    <th className="px-5 py-3 font-medium">Route</th>
                    <th className="px-5 py-3 font-medium">Vehicle</th>
                    <th className="px-5 py-3 font-medium">Driver</th>
                    <th className="px-5 py-3 font-medium">Cargo</th>
                    <th className="px-5 py-3 font-medium">Distance</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {trips.map((trip) => (
                    <tr
                      className="cursor-pointer border-t border-border transition hover:bg-panel/70"
                      key={trip.id}
                      onClick={() => setSelectedTrip(trip)}
                    >
                      <td className="px-5 py-4">
                        <p className="font-medium text-white">{trip.source}</p>
                        <p className="mt-1 text-xs text-muted">to {trip.destination}</p>
                      </td>
                      <td className="px-5 py-4 text-slate-300">{getVehicleLabel(trip.vehicleId)}</td>
                      <td className="px-5 py-4 text-slate-300">{getDriverLabel(trip.driverId)}</td>
                      <td className="px-5 py-4 text-slate-300">{formatNumber(trip.cargoWeightKg)} kg</td>
                      <td className="px-5 py-4 text-slate-300">{formatNumber(trip.plannedDistanceKm)} km</td>
                      <td className="px-5 py-4">
                        <TripStatusBadge status={trip.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="space-y-5">
          <form className="rounded-lg border border-border bg-surface p-5" onSubmit={handleCreateTrip}>
            <div className="mb-5">
              <h3 className="text-base font-semibold">Create Draft Trip</h3>
              <p className="mt-1 text-sm text-muted">Only available vehicles and drivers should be selected.</p>
            </div>
            <div className="grid gap-4">
              <Field error={errors.source} label="Source" name="source" onChange={handleTripFieldChange} value={tripValues.source} />
              <Field
                error={errors.destination}
                label="Destination"
                name="destination"
                onChange={handleTripFieldChange}
                value={tripValues.destination}
              />
              <label className="block">
                <span className="text-xs font-medium uppercase tracking-wide text-muted">Vehicle</span>
                <select
                  className="mt-2 h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none transition focus:border-primary"
                  onChange={(event) => handleTripFieldChange("vehicleId", event.target.value)}
                  value={tripValues.vehicleId}
                >
                  <option value="">Select vehicle</option>
                  {availableVehicles.map((vehicle) => (
                    <option key={vehicle.id} value={vehicle.id}>
                      {vehicle.regNumber} · {vehicle.name}
                    </option>
                  ))}
                </select>
                {errors.vehicleId ? <span className="mt-1 block text-xs text-red-300">{errors.vehicleId}</span> : null}
              </label>
              <label className="block">
                <span className="text-xs font-medium uppercase tracking-wide text-muted">Driver</span>
                <select
                  className="mt-2 h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none transition focus:border-primary"
                  onChange={(event) => handleTripFieldChange("driverId", event.target.value)}
                  value={tripValues.driverId}
                >
                  <option value="">Select driver</option>
                  {availableDrivers.map((driver) => (
                    <option key={driver.id} value={driver.id}>
                      {driver.name} · {driver.licenseNumber}
                    </option>
                  ))}
                </select>
                {errors.driverId ? <span className="mt-1 block text-xs text-red-300">{errors.driverId}</span> : null}
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  error={errors.cargoWeightKg}
                  label="Cargo Kg"
                  name="cargoWeightKg"
                  onChange={handleTripFieldChange}
                  type="number"
                  value={tripValues.cargoWeightKg}
                />
                <Field
                  error={errors.plannedDistanceKm}
                  label="Distance Km"
                  name="plannedDistanceKm"
                  onChange={handleTripFieldChange}
                  type="number"
                  value={tripValues.plannedDistanceKm}
                />
              </div>
            </div>
            <Button className="mt-5 w-full" disabled={isSaving} type="submit">
              <Plus className="mr-2 h-4 w-4" />
              {isSaving ? "Creating..." : "Create Draft"}
            </Button>
          </form>

          <div className="rounded-lg border border-border bg-surface p-5">
            <div className="mb-5 flex items-center gap-2">
              <Route className="h-5 w-5 text-primary" />
              <div>
                <h3 className="text-base font-semibold">Trip Actions</h3>
                <p className="mt-1 text-sm text-muted">
                  {selectedTrip ? `Trip #${selectedTrip.id} · ${selectedTrip.status}` : "Select a trip from the table"}
                </p>
              </div>
            </div>

            {selectedTrip ? (
              <div className="grid gap-3">
                <Button
                  disabled={isSaving || selectedTrip.status !== "Draft"}
                  onClick={() => void runTripAction(() => dispatchTrip(selectedTrip))}
                  type="button"
                >
                  <Play className="mr-2 h-4 w-4" />
                  Dispatch
                </Button>
                <div className="grid gap-3 rounded-md border border-border bg-background p-3">
                  <input
                    className="h-10 rounded-md border border-border bg-surface px-3 text-sm text-foreground outline-none transition focus:border-primary"
                    onChange={(event) =>
                      setCompleteValues((current) => ({ ...current, finalOdometerKm: event.target.value }))
                    }
                    placeholder="Final odometer km"
                    type="number"
                    value={completeValues.finalOdometerKm}
                  />
                  <input
                    className="h-10 rounded-md border border-border bg-surface px-3 text-sm text-foreground outline-none transition focus:border-primary"
                    onChange={(event) =>
                      setCompleteValues((current) => ({ ...current, fuelConsumedLiters: event.target.value }))
                    }
                    placeholder="Fuel consumed liters"
                    type="number"
                    value={completeValues.fuelConsumedLiters}
                  />
                  <Button
                    disabled={
                      isSaving ||
                      selectedTrip.status !== "Dispatched" ||
                      !completeValues.finalOdometerKm ||
                      !completeValues.fuelConsumedLiters
                    }
                    onClick={() => void runTripAction(() => completeTrip(selectedTrip, completeValues))}
                    type="button"
                    variant="outline"
                  >
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Complete Trip
                  </Button>
                </div>
                <Button
                  disabled={isSaving || selectedTrip.status === "Completed" || selectedTrip.status === "Cancelled"}
                  onClick={() => void runTripAction(() => cancelTrip(selectedTrip))}
                  type="button"
                  variant="outline"
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Cancel Trip
                </Button>
              </div>
            ) : (
              <p className="text-sm text-muted">Choose a trip to dispatch, complete, or cancel it.</p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

