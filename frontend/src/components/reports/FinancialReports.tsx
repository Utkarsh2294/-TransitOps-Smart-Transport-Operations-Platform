import { Download, RefreshCw, TrendingUp } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { downloadVehicleCostReportCsv, getFleetDashboardReport, getVehicleCostReport } from "../../lib/reports";
import type { ApiErrorResponse } from "../../lib/api";
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
  helper?: string;
};

const KpiCard = ({ helper, label, value }: KpiCardProps) => (
  <div className="rounded-lg border border-border bg-surface p-5">
    <p className="text-sm text-muted">{label}</p>
    <p className="mt-2 text-3xl font-semibold">{value}</p>
    {helper ? <p className="mt-2 text-xs text-muted">{helper}</p> : null}
  </div>
);

export const FinancialReports = () => {
  const [dashboard, setDashboard] = useState<FleetDashboardReport | null>(null);
  const [vehicleCosts, setVehicleCosts] = useState<VehicleCostReportRow[]>([]);
  const [serverError, setServerError] = useState<ApiErrorResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  const topCostVehicles = useMemo(
    () =>
      [...vehicleCosts]
        .sort((first, second) => second.totalOperationalCost - first.totalOperationalCost)
        .slice(0, 5),
    [vehicleCosts],
  );

  const loadReports = async () => {
    setIsLoading(true);
    setServerError(null);

    try {
      const [dashboardResponse, costResponse] = await Promise.all([
        getFleetDashboardReport(),
        getVehicleCostReport(),
      ]);
      setDashboard(dashboardResponse.data);
      setVehicleCosts(costResponse.data);
    } catch (error) {
      setServerError(error as ApiErrorResponse);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadReports();
  }, []);

  const handleExportCsv = async () => {
    setIsExporting(true);
    setServerError(null);

    try {
      await downloadVehicleCostReportCsv();
    } catch {
      setServerError({ field: "export", message: "CSV export failed" });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <section className="mx-auto max-w-7xl px-4 py-6 lg:px-8">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm text-muted">Operations & Analytics</p>
          <h2 className="mt-1 text-2xl font-semibold">Financial Reports</h2>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => void loadReports()} type="button" variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button disabled={isExporting} onClick={() => void handleExportCsv()} type="button">
            <Download className="mr-2 h-4 w-4" />
            {isExporting ? "Exporting..." : "Export CSV"}
          </Button>
        </div>
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
              helper={`${dashboard.kpis.activeVehicles} active of ${dashboard.kpis.totalVehicles}`}
              label="Fleet Utilization"
              value={`${dashboard.kpis.fleetUtilizationPercent}%`}
            />
            <KpiCard label="Active Trips" value={formatNumber(dashboard.kpis.activeTrips)} />
            <KpiCard label="Vehicles In Shop" value={formatNumber(dashboard.kpis.maintenanceVehicles)} />
            <KpiCard label="Drivers On Duty" value={formatNumber(dashboard.kpis.driversOnDuty)} />
          </div>

          <div className="mb-6 grid gap-4 md:grid-cols-4">
            <KpiCard label="Operational Cost" value={formatCurrency(dashboard.analytics.totalOperationalCost)} />
            <KpiCard label="Fuel Cost" value={formatCurrency(dashboard.analytics.fuelCost)} />
            <KpiCard label="Maintenance Cost" value={formatCurrency(dashboard.analytics.maintenanceCost)} />
            <KpiCard
              label="Fuel Efficiency"
              value={formatMetric(dashboard.analytics.fuelEfficiencyKmPerLiter, " km/L")}
            />
          </div>
        </>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="overflow-hidden rounded-lg border border-border bg-surface">
          <div className="border-b border-border px-5 py-4">
            <h3 className="text-base font-semibold">Vehicle Cost Report</h3>
          </div>

          {vehicleCosts.length === 0 && !isLoading ? (
            <div className="p-10 text-center">
              <p className="text-lg font-semibold">No report data yet</p>
              <p className="mt-2 text-sm text-muted">Fuel, expense, maintenance, and trip data will appear here.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1040px] border-collapse text-left text-sm">
                <thead className="bg-panel text-xs uppercase tracking-wide text-muted">
                  <tr>
                    <th className="px-5 py-3 font-medium">Vehicle</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                    <th className="px-5 py-3 font-medium">Fuel</th>
                    <th className="px-5 py-3 font-medium">Maintenance</th>
                    <th className="px-5 py-3 font-medium">Expenses</th>
                    <th className="px-5 py-3 font-medium">Total Cost</th>
                    <th className="px-5 py-3 font-medium">Efficiency</th>
                    <th className="px-5 py-3 font-medium">ROI</th>
                  </tr>
                </thead>
                <tbody>
                  {vehicleCosts.map((row) => (
                    <tr className="border-t border-border transition hover:bg-panel/70" key={row.vehicleId}>
                      <td className="px-5 py-4">
                        <p className="font-medium text-foreground">{row.regNumber}</p>
                        <p className="mt-1 text-xs text-muted">{row.name}</p>
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge status={row.status} />
                      </td>
                      <td className="px-5 py-4 text-muted">{formatCurrency(row.fuelCost)}</td>
                      <td className="px-5 py-4 text-muted">{formatCurrency(row.maintenanceCost)}</td>
                      <td className="px-5 py-4 text-muted">{formatCurrency(row.expenseCost)}</td>
                      <td className="px-5 py-4 font-medium text-foreground">
                        {formatCurrency(row.totalOperationalCost)}
                      </td>
                      <td className="px-5 py-4 text-muted">
                        {formatMetric(row.fuelEfficiencyKmPerLiter, " km/L")}
                      </td>
                      <td className="px-5 py-4 text-muted">{formatMetric(row.roiPercent, "%")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <aside className="rounded-lg border border-border bg-surface p-5">
          <div className="mb-4 flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-md bg-primary/10 text-primary">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold">Highest Cost</h3>
              <p className="text-sm text-muted">Top vehicles by spend</p>
            </div>
          </div>

          <div className="space-y-3">
            {topCostVehicles.length === 0 ? (
              <p className="text-sm text-muted">No vehicle cost records yet.</p>
            ) : (
              topCostVehicles.map((vehicle) => (
                <div className="rounded-md border border-border bg-background p-3" key={vehicle.vehicleId}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-foreground">{vehicle.regNumber}</p>
                      <p className="mt-1 text-xs text-muted">{vehicle.name}</p>
                    </div>
                    <p className="text-sm font-semibold text-foreground">
                      {formatCurrency(vehicle.totalOperationalCost)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </aside>
      </div>
    </section>
  );
};
