import { Check, CirclePlus, RefreshCw, Wrench } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";

import type { ApiErrorResponse } from "../../lib/api";
import { closeMaintenance, getVehicleMaintenance, openMaintenance } from "../../lib/maintenance";
import type { MaintenanceLog } from "../../types/maintenance";
import type { Vehicle } from "../../types/vehicle";
import { Button } from "../ui/Button";
import { StatusBadge } from "../ui/StatusBadge";

type VehicleMaintenanceProps = {
  vehicle: Vehicle;
  onChanged: () => Promise<void>;
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);

export const VehicleMaintenance = ({ vehicle, onChanged }: VehicleMaintenanceProps) => {
  const [logs, setLogs] = useState<MaintenanceLog[]>([]);
  const [type, setType] = useState("");
  const [cost, setCost] = useState("");
  const [error, setError] = useState<ApiErrorResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const loadLogs = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await getVehicleMaintenance(vehicle.id);
      setLogs(response.data);
    } catch (requestError) {
      setError(requestError as ApiErrorResponse);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadLogs();
  }, [vehicle.id]);

  const submitOpen = async (event: FormEvent) => {
    event.preventDefault();
    const amount = Number(cost);

    if (!type.trim()) {
      setError({ field: "type", message: "Maintenance type is required" });
      return;
    }
    if (!Number.isFinite(amount) || amount < 0) {
      setError({ field: "cost", message: "Maintenance cost cannot be negative" });
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      await openMaintenance(vehicle.id, type.trim(), amount);
      setType("");
      setCost("");
      await Promise.all([loadLogs(), onChanged()]);
    } catch (requestError) {
      setError(requestError as ApiErrorResponse);
    } finally {
      setIsSaving(false);
    }
  };

  const submitClose = async (maintenanceId: number) => {
    setIsSaving(true);
    setError(null);
    try {
      await closeMaintenance(maintenanceId);
      await Promise.all([loadLogs(), onChanged()]);
    } catch (requestError) {
      setError(requestError as ApiErrorResponse);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="mt-5 rounded-lg border border-border bg-surface p-5 shadow-card">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-primary">Vehicle service record</p>
          <h3 className="mt-1 text-lg font-semibold">Maintenance</h3>
        </div>
        <Button aria-label="Refresh maintenance records" onClick={() => void loadLogs()} size="icon" type="button" variant="outline">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      <form className="mt-5 grid gap-3 sm:grid-cols-[minmax(0,1fr)_130px_auto]" onSubmit={submitOpen}>
        <input
          className="h-10 rounded-md border border-border bg-background px-3 text-sm outline-none transition placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary"
          onChange={(event) => setType(event.target.value)}
          placeholder="Service type"
          value={type}
        />
        <input
          className="h-10 rounded-md border border-border bg-background px-3 text-sm outline-none transition placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary"
          min="0"
          onChange={(event) => setCost(event.target.value)}
          placeholder="Cost (INR)"
          type="number"
          value={cost}
        />
        <Button disabled={isSaving || vehicle.status === "Retired"} type="submit">
          <CirclePlus className="mr-2 h-4 w-4" />
          Open
        </Button>
      </form>

      {vehicle.status === "Retired" ? <p className="mt-2 text-xs text-muted">Retired vehicles cannot be sent to maintenance.</p> : null}
      {error ? <p className="mt-3 rounded-md border border-danger bg-background px-3 py-2 text-sm text-danger">{error.message}</p> : null}

      <div className="mt-5 space-y-2">
        {isLoading ? Array.from({ length: 3 }).map((_, index) => <div className="h-16 animate-pulse rounded-md bg-panel" key={index} />) : null}
        {!isLoading && logs.length === 0 ? (
          <div className="rounded-md border border-dashed border-border px-4 py-8 text-center text-sm text-muted">No maintenance records for this vehicle.</div>
        ) : null}
        {!isLoading && logs.map((log) => (
          <div className="flex flex-col gap-3 rounded-md border border-border bg-raised p-3 sm:flex-row sm:items-center sm:justify-between" key={log.id}>
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-panel text-primary"><Wrench className="h-4 w-4" /></div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{log.type}</p>
                <p className="mt-0.5 text-xs text-muted">Opened {new Date(log.openedAt).toLocaleDateString("en-IN")} · {formatCurrency(log.cost)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge status={log.status} />
              {log.status === "Open" ? <Button disabled={isSaving} onClick={() => void submitClose(log.id)} size="sm" type="button" variant="outline"><Check className="mr-1.5 h-4 w-4" />Close</Button> : null}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
