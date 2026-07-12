import { AlertTriangle, ArrowRight, BrainCircuit, RefreshCw, Route, Wrench, Activity } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import type { ApiErrorResponse } from "../../lib/api";
import { getFleetInsights } from "../../lib/insights";
import { getFleetDashboardReport, getVehicleCostReport } from "../../lib/reports";
import type { FleetInsightResponse } from "../../types/insights";
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
  <div className="flex flex-col justify-between h-full">
    <div>
      <p className="text-sm text-muted font-medium">{label}</p>
      <p className="mt-2 text-3xl font-bold">{value}</p>
    </div>
    <p className="mt-2 text-xs text-muted font-medium bg-raised p-2 rounded-md border border-border">{helper}</p>
  </div>
);

export const FleetManagerDashboard = () => {
  const [dashboard, setDashboard] = useState<FleetDashboardReport | null>(null);
  const [vehicleCosts, setVehicleCosts] = useState<VehicleCostReportRow[]>([]);
  const [insights, setInsights] = useState<FleetInsightResponse | null>(null);
  const [serverError, setServerError] = useState<ApiErrorResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
      const [dashboardResponse, costsResponse, insightsResponse] = await Promise.all([
        getFleetDashboardReport(),
        getVehicleCostReport(),
        getFleetInsights(),
      ]);
      setDashboard(dashboardResponse.data);
      setVehicleCosts(costsResponse.data);
      setInsights(insightsResponse.data);
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
    <section className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted">Fleet Manager</p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight">Operations Dashboard</h2>
        </div>
        <Button onClick={() => void loadDashboard()} type="button" variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {serverError ? (
        <div className="rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-red-200">
          {serverError.message}
        </div>
      ) : null}

      {isLoading ? (
        <div className="bento-grid">
          {Array.from({ length: 4 }).map((_, index) => (
            <div className="bento-tile tile-1x1 animate-pulse bg-panel" key={index} />
          ))}
          <div className="bento-tile tile-2x2 animate-pulse bg-panel" />
          <div className="bento-tile tile-2x1 animate-pulse bg-panel" />
        </div>
      ) : dashboard ? (
        <div className="bento-grid">
          
          {/* Top Row: AI Insights (Wide) */}
          <div className="bento-tile tile-2x1 bg-surface shadow-sm flex flex-col justify-center">
            <div className="flex items-center gap-2 mb-3">
              <div className="grid h-9 w-9 place-items-center rounded-md bg-primary/10 text-primary">
                <BrainCircuit className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold">AI Fleet Insights</h3>
                <p className="text-xs text-muted">
                  {insights?.source === "ai" ? "AI generated summary" : "Rules-based fallback summary"}
                </p>
              </div>
            </div>
            <p className="text-sm leading-6 font-medium text-foreground">
              {insights?.briefing ?? "No briefing available yet."}
            </p>
          </div>

          <div className="bento-tile tile-1x1 bg-surface shadow-sm">
            <KpiCard
              helper={`${dashboard.kpis.activeVehicles} active of ${dashboard.kpis.totalVehicles} total`}
              label="Fleet Utilization"
              value={`${dashboard.kpis.fleetUtilizationPercent}%`}
            />
          </div>
          <div className="bento-tile tile-1x1 bg-surface shadow-sm">
            <KpiCard
              helper={`${dashboard.kpis.pendingTrips} waiting in draft`}
              label="Active Trips"
              value={formatNumber(dashboard.kpis.activeTrips)}
            />
          </div>

          {/* Actionable Insights */}
          <div className="bento-tile tile-2x2 bg-surface shadow-sm overflow-hidden flex flex-col">
            <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
              <Activity className="h-5 w-5 text-warning" /> Suggested Actions
            </h3>
            <div className="flex-1 overflow-y-auto pr-2 space-y-3">
              {(insights?.actions ?? []).map((action, idx) => (
                <div className="rounded-lg border border-border bg-raised p-3 flex justify-between items-start" key={idx}>
                  <div>
                    <p className="font-semibold text-sm">{action.label}</p>
                    <p className="text-xs text-muted mt-1">{action.detail}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${action.severity === 'danger' ? 'bg-danger/10 text-danger' : action.severity === 'warning' ? 'bg-warning/10 text-warning' : 'bg-info/10 text-info'}`}>
                    {action.severity}
                  </span>
                </div>
              ))}
              {(insights?.actions?.length ?? 0) === 0 && (
                <p className="text-sm text-muted">No immediate actions needed.</p>
              )}
            </div>
          </div>

          {/* Attention Queue */}
          <div className="bento-tile tile-2x2 bg-surface shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-semibold flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-danger" /> Attention Queue
              </h3>
            </div>
            
            <div className="flex-1 overflow-y-auto pr-2 space-y-2">
              {vehiclesNeedingAttention.length === 0 ? (
                <p className="text-sm text-muted py-4">No vehicle issues flagged.</p>
              ) : (
                vehiclesNeedingAttention.map((vehicle) => (
                  <div className="border border-border rounded-lg bg-raised p-3 flex justify-between items-center" key={vehicle.vehicleId}>
                    <div>
                      <p className="font-semibold text-sm">{vehicle.regNumber}</p>
                      <StatusBadge status={vehicle.status} />
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-sm">{formatCurrency(vehicle.totalOperationalCost)}</p>
                      <p className="text-xs text-muted">{formatMetric(vehicle.fuelEfficiencyKmPerLiter, " km/L")}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bento-tile tile-1x1 bg-surface shadow-sm">
            <KpiCard
              helper="Unavailable for dispatch"
              label="Vehicles In Shop"
              value={formatNumber(dashboard.kpis.maintenanceVehicles)}
            />
          </div>
          <div className="bento-tile tile-1x1 bg-surface shadow-sm">
            <KpiCard
              helper={`${dashboard.kpis.availableVehicles} vehicles available`}
              label="Drivers On Duty"
              value={formatNumber(dashboard.kpis.driversOnDuty)}
            />
          </div>
          
        </div>
      ) : null}
    </section>
  );
};
