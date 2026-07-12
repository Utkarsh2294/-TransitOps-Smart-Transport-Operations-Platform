import { AlertTriangle, ArrowRight, RefreshCw, Route, Wrench } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import type { ApiErrorResponse } from "../../lib/api";
import { getFleetDashboardReport, getVehicleCostReport } from "../../lib/reports";
import type { FleetDashboardReport, VehicleCostReportRow } from "../../types/report";
import { Button } from "../ui/Button";
import { StatusBadge } from "../ui/StatusBadge";

const formatNumber = (value: number) =>
  new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(value);

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    currency: "INR",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(value);

const formatMetric = (value: number | null, suffix = "") =>
  value === null ? "N/A" : `${formatNumber(value)}${suffix}`;

type KpiCardProps = {
  label: string;
  value: string;
  helper: string;
};

const KpiCard = ({ helper, label, value }: KpiCardProps) => (
  <div className="rounded-lg border border-border bg-surface p-5 shadow-card">
    <p className="text-sm text-muted">{label}</p>
    <p className="mt-2 text-3xl font-semibold">{value}</p>
    <p className="mt-2 text-xs text-muted">{helper}</p>
  </div>
);

export const FleetManagerDashboard = () => {
  const [dashboard, setDashboard] = useState<FleetDashboardReport | null>(null);
  const [vehicleCosts, setVehicleCosts] = useState<VehicleCostReportRow[]>([]);
  const [serverError, setServerError] = useState<ApiErrorResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const highCostVehicles = useMemo(
    () =>
      [...vehicleCosts]
        .sort((first, second) => second.totalOperationalCost - first.totalOperationalCost)
        .slice(0, 4),
    [vehicleCosts],
  );

  const vehiclesNeedingAttention = useMemo(
    () =>
      vehicleCosts
        .filter((vehicle) => vehicle.status === "In_Shop" || vehicle.totalOperationalCost > 0)
        .slice(0, 4),
    [vehicleCosts],
  );

  const loadDashboard = async () => {
    setIsLoading(true);
    setServerError(null);

    try {
      const [dashboardResponse, costsResponse] = await Promise.all([
        getFleetDashboardReport(),
        getVehicleCostReport(),
      ]);
      setDashboard(dashboardResponse.data);
      setVehicleCosts(costsResponse.data);
    } catch (error) {
      setServerError(error as ApiErrorResponse);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadDashboard();
  }, []);

  return (
    <section className="mx-auto max-w-7xl px-4 py-6 lg:px-8">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm text-muted">Fleet Manager</p>
          <h2 className="mt-1 text-2xl font-semibold">Operations Dashboard</h2>
        </div>
        <Button onClick={() => void loadDashboard()} type="button" variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {serverError ? (
        <div className="mb-6 rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-red-200">
          {serverError.message}
        </div>
      ) : null}

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div className="h-28 animate-pulse rounded-lg bg-panel" key={index} />
          ))}
        </div>
      ) : dashboard ? (
        <>
          <div className="mb-6 grid gap-4 md:grid-cols-4">
            <KpiCard
              helper={`${dashboard.kpis.activeVehicles} active of ${dashboard.kpis.totalVehicles} total`}
              label="Fleet Utilization"
              value={`${dashboard.kpis.fleetUtilizationPercent}%`}
            />
            <KpiCard
              helper={`${dashboard.kpis.pendingTrips} waiting in draft`}
              label="Active Trips"
              value={formatNumber(dashboard.kpis.activeTrips)}
            />
            <KpiCard
              helper="Unavailable for dispatch"
              label="Vehicles In Shop"
              value={formatNumber(dashboard.kpis.maintenanceVehicles)}
            />
            <KpiCard
              helper={`${dashboard.kpis.availableVehicles} vehicles available`}
              label="Drivers On Duty"
              value={formatNumber(dashboard.kpis.driversOnDuty)}
            />
          </div>

          <div className="mb-6 grid gap-4 md:grid-cols-4">
            <KpiCard
              helper={`${formatNumber(dashboard.analytics.fuelLiters)} fuel liters logged`}
              label="Operational Cost"
              value={formatCurrency(dashboard.analytics.totalOperationalCost)}
            />
            <KpiCard
              helper="Fuel logs and completed trip fuel"
              label="Fuel Efficiency"
              value={formatMetric(dashboard.analytics.fuelEfficiencyKmPerLiter, " km/L")}
            />
            <KpiCard
              helper="Completed trip distance"
              label="Distance Covered"
              value={`${formatNumber(dashboard.analytics.completedDistanceKm)} km`}
            />
            <KpiCard
              helper="Fuel, maintenance, and expenses"
              label="Cost Breakdown"
              value={formatCurrency(
                dashboard.analytics.fuelCost +
                  dashboard.analytics.maintenanceCost +
                  dashboard.analytics.expenseCost,
              )}
            />
          </div>

          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
            <div className="overflow-hidden rounded-lg border border-border bg-surface">
              <div className="flex items-center justify-between border-b border-border px-5 py-4">
                <div>
                  <h3 className="text-base font-semibold">Fleet Attention Queue</h3>
                  <p className="mt-1 text-sm text-muted">Vehicles with current cost or maintenance signals</p>
                </div>
                <AlertTriangle className="h-5 w-5 text-warning" />
              </div>

              {vehiclesNeedingAttention.length === 0 ? (
                <div className="p-10 text-center">
                  <p className="text-lg font-semibold">No vehicle issues flagged</p>
                  <p className="mt-2 text-sm text-muted">Maintenance and cost activity will appear here.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[760px] border-collapse text-left text-sm">
                    <thead className="bg-panel text-xs uppercase tracking-wide text-muted">
                      <tr>
                        <th className="px-5 py-3 font-medium">Vehicle</th>
                        <th className="px-5 py-3 font-medium">Status</th>
                        <th className="px-5 py-3 font-medium">Trips</th>
                        <th className="px-5 py-3 font-medium">Total Cost</th>
                        <th className="px-5 py-3 font-medium">Efficiency</th>
                      </tr>
                    </thead>
                    <tbody>
                      {vehiclesNeedingAttention.map((vehicle) => (
                        <tr className="border-t border-border transition hover:bg-panel/70" key={vehicle.vehicleId}>
                          <td className="px-5 py-4">
                            <p className="font-medium text-white">{vehicle.regNumber}</p>
                            <p className="mt-1 text-xs text-muted">{vehicle.name}</p>
                          </td>
                          <td className="px-5 py-4">
                            <StatusBadge status={vehicle.status} />
                          </td>
                          <td className="px-5 py-4 text-slate-300">{vehicle.completedTrips}</td>
                          <td className="px-5 py-4 font-medium text-white">
                            {formatCurrency(vehicle.totalOperationalCost)}
                          </td>
                          <td className="px-5 py-4 text-slate-300">
                            {formatMetric(vehicle.fuelEfficiencyKmPerLiter, " km/L")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <aside className="space-y-5">
              <div className="rounded-lg border border-border bg-surface p-5">
                <div className="mb-4 flex items-center gap-2">
                  <div className="grid h-9 w-9 place-items-center rounded-md bg-primary/10 text-primary">
                    <Route className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold">Trip Snapshot</h3>
                    <p className="text-sm text-muted">Current dispatch load</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between rounded-md border border-border bg-background p-3">
                    <span className="text-sm text-muted">Active trips</span>
                    <span className="font-semibold">{dashboard.kpis.activeTrips}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-md border border-border bg-background p-3">
                    <span className="text-sm text-muted">Pending trips</span>
                    <span className="font-semibold">{dashboard.kpis.pendingTrips}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-md border border-border bg-background p-3">
                    <span className="text-sm text-muted">Drivers on duty</span>
                    <span className="font-semibold">{dashboard.kpis.driversOnDuty}</span>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-border bg-surface p-5">
                <div className="mb-4 flex items-center gap-2">
                  <div className="grid h-9 w-9 place-items-center rounded-md bg-warning/10 text-warning">
                    <Wrench className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold">Highest Cost</h3>
                    <p className="text-sm text-muted">Top spend vehicles</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {highCostVehicles.length === 0 ? (
                    <p className="text-sm text-muted">No cost records yet.</p>
                  ) : (
                    highCostVehicles.map((vehicle) => (
                      <div className="rounded-md border border-border bg-background p-3" key={vehicle.vehicleId}>
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-medium text-white">{vehicle.regNumber}</p>
                            <p className="mt-1 text-xs text-muted">{vehicle.name}</p>
                          </div>
                          <p className="text-sm font-semibold text-white">
                            {formatCurrency(vehicle.totalOperationalCost)}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="rounded-lg border border-border bg-surface p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold">Next Best Action</h3>
                    <p className="mt-1 text-sm text-muted">Review in-shop vehicles and draft trips before dispatch.</p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-primary" />
                </div>
              </div>
            </aside>
          </div>
        </>
      ) : null}
    </section>
  );
};

