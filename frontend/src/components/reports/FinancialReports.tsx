import { Download, RefreshCw, TrendingUp, Save, Clock } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { PieChart, Pie, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from "recharts";

import { downloadVehicleCostReportCsv, getFleetDashboardReport, getVehicleCostReport } from "../../lib/reports";
import { apiRequest } from "../../lib/api";
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
  <div className="rounded-lg border border-border bg-surface p-5 shadow-sm">
    <p className="text-sm text-muted font-medium">{label}</p>
    <p className="mt-2 text-3xl font-bold">{value}</p>
    {helper ? <p className="mt-2 text-xs text-muted bg-raised border border-border p-1.5 rounded inline-block">{helper}</p> : null}
  </div>
);

const COLORS = ["#10b981", "#3e63dd", "#f59e0b", "#f43f5e", "#8b5cf6"];

export const FinancialReports = () => {
  const [dashboard, setDashboard] = useState<FleetDashboardReport | null>(null);
  const [vehicleCosts, setVehicleCosts] = useState<VehicleCostReportRow[]>([]);
  const [brief, setBrief] = useState<any>(null);
  const [tripEfficiency, setTripEfficiency] = useState<any[]>([]);
  const [snapshots, setSnapshots] = useState<any[]>([]);
  
  const [serverError, setServerError] = useState<ApiErrorResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  const loadReports = async () => {
    setIsLoading(true);
    setServerError(null);

    try {
      const [dashboardRes, costRes, briefRes, tripEffRes, snapRes] = await Promise.all([
        getFleetDashboardReport(),
        getVehicleCostReport(),
        apiRequest<any>("/reports/financial-brief"),
        apiRequest<any>("/reports/trip-efficiency"),
        apiRequest<any>("/reports/snapshots")
      ]);
      setDashboard(dashboardRes.data);
      setVehicleCosts(costRes.data);
      setBrief(briefRes.data);
      setTripEfficiency(tripEffRes.data);
      setSnapshots(snapRes.data);
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
    try {
      await downloadVehicleCostReportCsv();
    } catch {
      setServerError({ field: "export", message: "CSV export failed" });
    } finally {
      setIsExporting(false);
    }
  };
  
  const handleSaveSnapshot = async () => {
    try {
      await apiRequest("/reports/snapshot", { method: "POST" });
      const snapRes = await apiRequest<any>("/reports/snapshots");
      setSnapshots(snapRes.data);
    } catch (error) {
      console.error(error);
    }
  };

  const costBreakdownData = [
    { name: 'Fuel', value: dashboard?.analytics.fuelCost ?? 0 },
    { name: 'Maintenance', value: dashboard?.analytics.maintenanceCost ?? 0 },
    { name: 'Expenses', value: dashboard?.analytics.expenseCost ?? 0 },
  ];

  const vehicleChartData = vehicleCosts.slice(0, 5).map(v => ({
    name: v.regNumber,
    cost: v.totalOperationalCost,
    maintenance: v.maintenanceCost,
    efficiency: v.fuelEfficiencyKmPerLiter ?? 0
  }));

  return (
    <section className="mx-auto max-w-7xl px-4 py-6 lg:px-8 space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm text-muted">Operations & Analytics</p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight">Financial Reports</h2>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => void handleSaveSnapshot()} type="button" variant="outline">
            <Save className="mr-2 h-4 w-4" /> Save Snapshot
          </Button>
          <Button onClick={() => void loadReports()} type="button" variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" /> Refresh
          </Button>
          <Button disabled={isExporting} onClick={() => void handleExportCsv()} type="button">
            <Download className="mr-2 h-4 w-4" /> {isExporting ? "Exporting..." : "Export CSV"}
          </Button>
        </div>
      </div>

      {serverError ? (
        <div className="rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
          {serverError.message}
        </div>
      ) : null}

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div className="h-32 animate-pulse rounded-lg bg-panel" key={index} />
          ))}
        </div>
      ) : dashboard ? (
        <>
          {/* 4-Tile KPI Strip */}
          <div className="grid gap-4 md:grid-cols-4">
            <KpiCard
              label="Fleet Utilization"
              value={`${dashboard.kpis.fleetUtilizationPercent}%`}
            />
            <KpiCard 
              label="Total Cost MTD" 
              value={formatCurrency(dashboard.analytics.totalOperationalCost)} 
            />
            <KpiCard 
              label="Avg Fuel Efficiency" 
              value={formatMetric(dashboard.analytics.fuelEfficiencyKmPerLiter, " km/L")} 
            />
            <KpiCard 
              label="Vehicles Over Budget" 
              value={(brief?.overBudgetVehiclesCount ?? 0).toString()} 
            />
          </div>
          
          {/* Charts (5 Recharts) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* 1. Fleet Cost Breakdown */}
            <div className="bg-surface border border-border rounded-lg p-4 h-[300px] flex flex-col">
              <h3 className="text-sm font-semibold mb-4">Fleet Cost Breakdown</h3>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={costBreakdownData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                    {costBreakdownData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            {/* 2. Monthly Cost by Vehicle */}
            <div className="bg-surface border border-border rounded-lg p-4 h-[300px] flex flex-col">
              <h3 className="text-sm font-semibold mb-4">Total Cost (Top 5)</h3>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={vehicleChartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" fontSize={12} tickLine={false} />
                  <YAxis fontSize={12} tickFormatter={(v) => `$${v}`} />
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  <Bar dataKey="cost" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            {/* 3. Maintenance Spend by Vehicle */}
            <div className="bg-surface border border-border rounded-lg p-4 h-[300px] flex flex-col">
              <h3 className="text-sm font-semibold mb-4">Maintenance Spend</h3>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={vehicleChartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" fontSize={12} tickLine={false} />
                  <YAxis fontSize={12} tickFormatter={(v) => `$${v}`} />
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  <Bar dataKey="maintenance" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            {/* 4. Fuel Efficiency Trend */}
            <div className="bg-surface border border-border rounded-lg p-4 h-[300px] flex flex-col lg:col-span-2">
              <h3 className="text-sm font-semibold mb-4">Fuel Efficiency (km/L)</h3>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={vehicleChartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" fontSize={12} tickLine={false} />
                  <YAxis fontSize={12} />
                  <Tooltip />
                  <Line type="monotone" dataKey="efficiency" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            
            {/* 5. Snapshots UI */}
            <div className="bg-surface border border-border rounded-lg p-4 h-[300px] flex flex-col">
              <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" /> Report Snapshots
              </h3>
              <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                {snapshots.length === 0 ? (
                  <p className="text-sm text-muted">No snapshots saved.</p>
                ) : (
                  snapshots.map(s => (
                    <div key={s.id} className="p-3 bg-raised border border-border rounded flex justify-between items-center">
                      <span className="text-sm">{new Date(s.createdAt).toLocaleString()}</span>
                      <a href={`/uploads/snapshots/${s.name}`} download className="text-primary hover:underline text-xs font-semibold flex items-center gap-1">
                        <Download className="h-3 w-3" /> DL
                      </a>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </>
      ) : null}

      <div className="overflow-hidden rounded-lg border border-border bg-surface mt-6">
        <div className="border-b border-border px-5 py-4">
          <h3 className="text-base font-semibold">Trip Efficiency Scorecard</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="bg-panel text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-5 py-3 font-medium">Vehicle</th>
                <th className="px-5 py-3 font-medium">Trip ID</th>
                <th className="px-5 py-3 font-medium">Actual (km/L)</th>
                <th className="px-5 py-3 font-medium">Vehicle Avg</th>
                <th className="px-5 py-3 font-medium">Efficiency</th>
              </tr>
            </thead>
            <tbody>
              {tripEfficiency.map((t) => (
                <tr className="border-t border-border transition hover:bg-panel/70" key={t.tripId}>
                  <td className="px-5 py-4 font-medium">{t.regNumber}</td>
                  <td className="px-5 py-4 text-muted">#{t.tripId}</td>
                  <td className="px-5 py-4">{t.actualEfficiency}</td>
                  <td className="px-5 py-4">{t.expectedEfficiency}</td>
                  <td className="px-5 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${t.deviationPercent < -10 ? 'bg-danger/10 text-danger' : t.deviationPercent > 5 ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>
                      {t.deviationPercent}% Deviation
                    </span>
                  </td>
                </tr>
              ))}
              {tripEfficiency.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-muted">No inefficient trips recorded.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};
