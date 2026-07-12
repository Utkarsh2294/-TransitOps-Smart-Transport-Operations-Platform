import { AlertTriangle, BadgeCheck, Download, RefreshCw, ShieldAlert, UserRoundCheck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import type { ApiErrorResponse } from "../../lib/api";
import { getDrivers, getSafetyHistory, unsuspendDriver } from "../../lib/drivers";
import { downloadCompliancePdf, getComplianceAlerts } from "../../lib/safety";
import type { ComplianceAlert } from "../../lib/safety";
import type { Driver } from "../../types/driver";
import { Button } from "../ui/Button";
import { StatusBadge } from "../ui/StatusBadge";
import { SafetySparkline } from "../ui/SafetySparkline";

const DAY_MS = 24 * 60 * 60 * 1000;

const daysUntil = (value: string) => Math.ceil((new Date(value).getTime() - Date.now()) / DAY_MS);

const expiryLabel = (value: string) => {
  const days = daysUntil(value);
  if (days < 0) return `Expired ${Math.abs(days)}d ago`;
  if (days === 0) return "Expires today";
  return `${days}d remaining`;
};

export const SafetyOfficerDashboard = () => {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [error, setError] = useState<ApiErrorResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [alerts, setAlerts] = useState<ComplianceAlert[]>([]);
  const [trends, setTrends] = useState<Record<number, number[]>>({});

  const loadDrivers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [response, alertResponse] = await Promise.all([getDrivers(1, 100), getComplianceAlerts()]);
      setDrivers(response.data);
      setAlerts(alertResponse.data);
      const histories = await Promise.all(response.data.slice(0, 6).map(async (driver) => [driver.id, (await getSafetyHistory(driver.id)).data.map((event) => event.score)] as const));
      setTrends(Object.fromEntries(histories));
    } catch (requestError) {
      setError(requestError as ApiErrorResponse);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadDrivers();
  }, []);

  const expiringDrivers = useMemo(
    () => drivers
      .filter((driver) => daysUntil(driver.licenseExpiryDate) <= 30)
      .sort((left, right) => new Date(left.licenseExpiryDate).getTime() - new Date(right.licenseExpiryDate).getTime()),
    [drivers],
  );
  const suspendedDrivers = useMemo(
    () => drivers.filter((driver) => driver.status === "Suspended"),
    [drivers],
  );
  const safetyLeaderboard = useMemo(
    () => [...drivers].sort((left, right) => right.safetyScore - left.safetyScore).slice(0, 6),
    [drivers],
  );
  const averageScore = useMemo(
    () => drivers.length ? Math.round(drivers.reduce((total, driver) => total + driver.safetyScore, 0) / drivers.length) : 0,
    [drivers],
  );
  const highAlerts = alerts.filter((alert) => alert.severity === "high");
  const mediumAlerts = alerts.filter((alert) => alert.severity === "medium");
  const lowAlerts = alerts.filter((alert) => alert.severity === "low");

  const handleUnsuspend = async (driverId: number) => {
    setUpdatingId(driverId);
    setError(null);
    try {
      const response = await unsuspendDriver(driverId);
      setDrivers((current) => current.map((driver) => driver.id === driverId ? response.data : driver));
    } catch (requestError) {
      setError(requestError as ApiErrorResponse);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <section className="mx-auto max-w-7xl px-4 py-7 lg:px-8">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Compliance control</p>
          <h2 className="mt-1 text-3xl font-semibold tracking-tight">Safety Officer</h2>
          <p className="mt-2 text-sm text-muted">License readiness, driver risk, and immediate compliance actions.</p>
        </div>
        <div className="flex gap-2"><Button onClick={() => void downloadCompliancePdf()} type="button" variant="outline"><Download className="mr-2 h-4 w-4" />Export Compliance Report</Button><Button onClick={() => void loadDrivers()} type="button" variant="outline"><RefreshCw className="mr-2 h-4 w-4" />Refresh</Button></div>
      </div>

      <div className="bento-grid mb-6">
        <div className="bento-tile tile-2x2 bg-raised shadow-card">
          <div className="flex items-start justify-between gap-4">
            <div><p className="text-sm text-muted">Needs attention today</p><p className={`mt-3 text-5xl font-semibold tracking-tight ${highAlerts.length ? "text-danger" : mediumAlerts.length ? "text-warning" : "text-success"}`}>{alerts.length}</p></div>
            <AlertTriangle className="h-5 w-5 text-warning" />
          </div>
          <div className="mt-8 grid grid-cols-2 gap-3">
            <div className="rounded-md border border-border bg-surface p-3"><p className="text-xs uppercase tracking-wide text-muted">Suspended</p><p className="mt-1 text-2xl font-semibold text-danger">{suspendedDrivers.length}</p></div>
            <div className="rounded-md border border-border bg-surface p-3"><p className="text-xs uppercase tracking-wide text-muted">Avg safety</p><p className="mt-1 text-2xl font-semibold text-success">{averageScore}</p></div>
          </div>
        </div>
        <div className="bento-tile tile-1x1 bg-surface shadow-card"><p className="text-sm text-muted">License expiry &lt; 30d</p><p className="mt-2 text-4xl font-semibold tracking-tight text-warning">{expiringDrivers.filter((driver) => daysUntil(driver.licenseExpiryDate) >= 0).length}</p></div>
        <div className="bento-tile tile-1x1 bg-surface shadow-card"><p className="text-sm text-muted">Expired license</p><p className="mt-2 text-4xl font-semibold tracking-tight text-danger">{expiringDrivers.filter((driver) => daysUntil(driver.licenseExpiryDate) < 0).length}</p></div>
        <div className="bento-tile tile-2x1 bg-surface shadow-card"><p className="text-sm text-muted">Driver records monitored</p><p className="mt-2 text-2xl font-semibold tracking-tight">{drivers.length}</p></div>
      </div>

      {error ? <div className="mb-5 rounded-md border border-danger bg-background px-4 py-3 text-sm text-danger">{error.message}</div> : null}
      <div className="mb-5 overflow-hidden rounded-[14px] border border-border bg-surface shadow-card"><div className="flex items-center justify-between border-b border-border px-5 py-4"><div><h3 className="font-semibold">Compliance alerts</h3><p className="mt-1 text-sm text-muted">{alerts.length ? `${alerts.length} items need attention today.` : "No compliance items need attention today."}</p></div><AlertTriangle className={highAlerts.length ? "h-5 w-5 text-danger" : "h-5 w-5 text-success"} /></div><div className="grid divide-y divide-border md:grid-cols-3 md:divide-x md:divide-y-0">{([ ["High", highAlerts], ["Medium", mediumAlerts], ["Low", lowAlerts] ] as const).map(([label, items]) => <div className="p-4" key={label}><p className="text-xs font-semibold uppercase tracking-wide text-muted">{label} ({items.length})</p>{items.length ? items.slice(0, 4).map((alert) => <div className="mt-3" key={`${alert.type}-${alert.entityId}-${alert.detail}`}><p className="truncate text-sm font-semibold">{alert.entityLabel}</p><p className="mt-0.5 line-clamp-2 text-xs text-muted">{alert.detail}</p></div>) : <p className="mt-5 text-sm text-muted">You’re clear.</p>}</div>)}</div></div>

      <div className="grid gap-5 xl:grid-cols-2">
        <div className="overflow-hidden rounded-lg border border-border bg-surface shadow-card">
          <div className="flex items-center justify-between border-b border-border px-5 py-4"><div><h3 className="font-semibold">License expiry countdown</h3><p className="mt-1 text-sm text-muted">Soonest expiry first, including expired licenses.</p></div><BadgeCheck className="h-5 w-5 text-primary" /></div>
          <div className="divide-y divide-border">
            {isLoading ? Array.from({ length: 5 }).map((_, index) => <div className="m-4 h-12 animate-pulse rounded-md bg-panel" key={index} />) : null}
            {!isLoading && expiringDrivers.length === 0 ? <p className="px-5 py-10 text-center text-sm text-muted">No licenses need attention in the next 30 days.</p> : null}
            {!isLoading && expiringDrivers.map((driver) => <div className="flex items-center justify-between gap-3 px-5 py-4" key={driver.id}><div><p className="font-semibold">{driver.name}</p><p className="mt-1 text-xs text-muted">{driver.licenseNumber} · Expires {new Date(driver.licenseExpiryDate).toLocaleDateString("en-IN")}</p></div><span className={daysUntil(driver.licenseExpiryDate) < 0 ? "text-sm font-semibold text-danger" : "text-sm font-semibold text-warning"}>{expiryLabel(driver.licenseExpiryDate)}</span></div>)}
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border border-border bg-surface shadow-card">
          <div className="flex items-center justify-between border-b border-border px-5 py-4"><div><h3 className="font-semibold">Safety-score leaderboard</h3><p className="mt-1 text-sm text-muted">Highest score first across the driver bench.</p></div><ShieldAlert className="h-5 w-5 text-primary" /></div>
          <div className="divide-y divide-border">
            {isLoading ? Array.from({ length: 5 }).map((_, index) => <div className="m-4 h-12 animate-pulse rounded-md bg-panel" key={index} />) : null}
            {!isLoading && safetyLeaderboard.map((driver, index) => <div className="flex items-center justify-between px-5 py-4" key={driver.id}><div className="flex items-center gap-3"><span className="flex h-7 w-7 items-center justify-center rounded-md bg-panel text-xs font-semibold text-muted">{index + 1}</span><div><p className="font-semibold">{driver.name}</p><p className="mt-1 text-xs text-muted">{driver.licenseCategory} · {driver.licenseNumber}</p></div></div><div className="flex items-center gap-3 text-success"><SafetySparkline scores={trends[driver.id] ?? []} /><span className="text-lg font-semibold">{driver.safetyScore}</span></div></div>)}
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border border-border bg-surface shadow-card xl:col-span-2">
          <div className="flex items-center justify-between border-b border-border px-5 py-4"><div><h3 className="font-semibold">Suspended drivers</h3><p className="mt-1 text-sm text-muted">Restore only after reviewing the driver’s compliance status.</p></div><UserRoundCheck className="h-5 w-5 text-danger" /></div>
          {isLoading ? <div className="m-5 h-16 animate-pulse rounded-md bg-panel" /> : null}
          {!isLoading && suspendedDrivers.length === 0 ? <p className="px-5 py-10 text-center text-sm text-muted">No suspended drivers need review.</p> : null}
          {!isLoading && suspendedDrivers.map((driver) => <div className="flex flex-col gap-3 border-t border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between" key={driver.id}><div className="flex items-center gap-3"><div><p className="font-semibold">{driver.name}</p><p className="mt-1 text-xs text-muted">{driver.licenseNumber} · {expiryLabel(driver.licenseExpiryDate)}</p></div><StatusBadge status={driver.status} /></div><Button disabled={updatingId === driver.id} onClick={() => void handleUnsuspend(driver.id)} type="button" variant="outline"><UserRoundCheck className="mr-2 h-4 w-4" />{updatingId === driver.id ? "Updating..." : "Unsuspend"}</Button></div>)}
        </div>
      </div>
    </section>
  );
};
