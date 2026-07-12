import { MapPin, Navigation, Package, Route, Truck } from "lucide-react";
import { useEffect, useState } from "react";

import type { ApiErrorResponse } from "../../lib/api";
import { getTrips } from "../../lib/trips";
import type { Trip, TripListResponse } from "../../types/trip";
import { StatusBadge } from "../ui/StatusBadge";

const formatNumber = (value: number) =>
  new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(value);

const statusOrder: Record<string, number> = { Dispatched: 0, Draft: 1, Completed: 2, Cancelled: 3 };

export const DriverHomeView = ({ driverName }: { driverName: string }) => {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [error, setError] = useState<ApiErrorResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const response: TripListResponse = await getTrips(1, 100);
        const sorted = [...response.data].sort(
          (a, b) => (statusOrder[a.status] ?? 9) - (statusOrder[b.status] ?? 9),
        );
        setTrips(sorted);
      } catch (err) {
        setError(err as ApiErrorResponse);
      } finally {
        setIsLoading(false);
      }
    };
    void load();
  }, []);

  const active = trips.filter((t) => t.status === "Dispatched");
  const pending = trips.filter((t) => t.status === "Draft");
  const completed = trips.filter((t) => t.status === "Completed");

  return (
    <section className="mx-auto max-w-5xl px-4 py-6 lg:px-8">
      <div className="mb-6">
        <p className="text-sm text-muted">Driver View</p>
        <h2 className="mt-1 text-2xl font-semibold">Welcome, {driverName}</h2>
      </div>

      {error ? (
        <div className="mb-6 rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
          {error.message}
        </div>
      ) : null}

      {/* Quick stats */}
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-border bg-surface p-5 shadow-card">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-info/10 text-info">
              <Navigation className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-semibold">{active.length}</p>
              <p className="text-sm text-muted">Active Trips</p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-border bg-surface p-5 shadow-card">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-warning/10 text-warning">
              <Route className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-semibold">{pending.length}</p>
              <p className="text-sm text-muted">Pending Trips</p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-border bg-surface p-5 shadow-card">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-success/10 text-success">
              <Truck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-semibold">{completed.length}</p>
              <p className="text-sm text-muted">Completed</p>
            </div>
          </div>
        </div>
      </div>

      {/* Trip list */}
      <div className="overflow-hidden rounded-lg border border-border bg-surface">
        <div className="border-b border-border px-5 py-4">
          <h3 className="text-base font-semibold">My Trips</h3>
          <p className="mt-1 text-sm text-muted">All assigned trips</p>
        </div>

        {isLoading ? (
          <div className="space-y-3 p-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div className="h-16 animate-pulse rounded-lg bg-panel" key={i} />
            ))}
          </div>
        ) : trips.length === 0 ? (
          <div className="p-10 text-center">
            <Route className="mx-auto h-10 w-10 text-muted" />
            <p className="mt-3 text-lg font-semibold">No trips assigned</p>
            <p className="mt-1 text-sm text-muted">
              Trips assigned to you will appear here.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {trips.map((trip) => (
              <div
                className="flex items-center gap-4 px-5 py-4 transition hover:bg-panel/50"
                key={trip.id}
              >
                <div className="hidden h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary sm:grid">
                  <MapPin className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium">
                    {trip.source} → {trip.destination}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
                    <span className="flex items-center gap-1">
                      <Package className="h-3 w-3" />
                      {formatNumber(trip.cargoWeightKg)} kg
                    </span>
                    <span>{formatNumber(trip.plannedDistanceKm)} km</span>
                    {trip.fuelConsumedLiters ? (
                      <span>{formatNumber(trip.fuelConsumedLiters)} L fuel</span>
                    ) : null}
                  </div>
                </div>
                <StatusBadge status={trip.status} />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
