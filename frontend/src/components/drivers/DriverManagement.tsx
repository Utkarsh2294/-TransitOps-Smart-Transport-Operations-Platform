import { CheckSquare, Plus, RefreshCw, Save, Trash2, X } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";

import { Button } from "../ui/Button";
import { SafetySparkline } from "../ui/SafetySparkline";
import { StatusBadge } from "../ui/StatusBadge";
import { bulkUpdateDriverStatus, createDriver, deleteDriver, getDrivers, getSafetyHistory, updateDriver } from "../../lib/drivers";
import type { ApiErrorResponse } from "../../lib/api";
import type { Driver, DriverFormValues, DriverStatus } from "../../types/driver";

const blankForm: DriverFormValues = {
  name: "",
  licenseNumber: "",
  licenseCategory: "",
  licenseExpiryDate: "",
  contactNumber: "",
  safetyScore: "100",
  status: "Available",
};

const statuses: DriverStatus[] = ["Available", "On_Trip", "Off_Duty", "Suspended"];

const toDateInputValue = (date: string) => new Date(date).toISOString().slice(0, 10);

const toFormValues = (driver: Driver): DriverFormValues => ({
  name: driver.name,
  licenseNumber: driver.licenseNumber,
  licenseCategory: driver.licenseCategory,
  licenseExpiryDate: toDateInputValue(driver.licenseExpiryDate),
  contactNumber: driver.contactNumber,
  safetyScore: String(driver.safetyScore),
  status: driver.status,
});

const validateDriver = (values: DriverFormValues) => {
  const errors: Partial<Record<keyof DriverFormValues, string>> = {};

  if (!values.name.trim()) errors.name = "Driver name is required";
  if (!values.licenseNumber.trim()) errors.licenseNumber = "License number is required";
  if (!values.licenseCategory.trim()) errors.licenseCategory = "License category is required";
  if (!values.licenseExpiryDate) errors.licenseExpiryDate = "License expiry date is required";
  if (!/^[+()\-\s0-9]{8,20}$/.test(values.contactNumber.trim())) {
    errors.contactNumber = "Contact number must be 8-20 digits or phone symbols";
  }
  if (Number(values.safetyScore) < 0 || Number(values.safetyScore) > 100) {
    errors.safetyScore = "Safety score must be between 0 and 100";
  }

  return errors;
};

type FieldProps = {
  error?: string;
  label: string;
  name: keyof DriverFormValues;
  onChange: (name: keyof DriverFormValues, value: string) => void;
  type?: string;
  value: string;
};

const Field = ({ error, label, name, onChange, type = "text", value }: FieldProps) => (
  <label className="block">
    <span className="text-xs font-medium uppercase tracking-wide text-muted">{label}</span>
    <input
      className="mt-2 h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none transition placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary"
      onChange={(event) => onChange(name, event.target.value)}
      type={type}
      value={value}
    />
    {error ? <span className="mt-1 block text-xs text-danger">{error}</span> : null}
  </label>
);

export const DriverManagement = () => {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [values, setValues] = useState<DriverFormValues>(blankForm);
  const [errors, setErrors] = useState<Partial<Record<keyof DriverFormValues, string>>>({});
  const [serverError, setServerError] = useState<ApiErrorResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [bulkStatus, setBulkStatus] = useState<DriverStatus>("Available");
  const [selectedTrend, setSelectedTrend] = useState<number[]>([]);

  const availableCount = useMemo(
    () => drivers.filter((driver) => driver.status === "Available").length,
    [drivers],
  );
  const expiringSoonCount = useMemo(() => {
    const now = new Date();
    const thirtyDays = new Date(now);
    thirtyDays.setDate(now.getDate() + 30);
    return drivers.filter((driver) => {
      const expiry = new Date(driver.licenseExpiryDate);
      return expiry > now && expiry <= thirtyDays;
    }).length;
  }, [drivers]);
  const suspendedCount = useMemo(
    () => drivers.filter((driver) => driver.status === "Suspended").length,
    [drivers],
  );
  const averageSafetyScore = useMemo(() => {
    if (drivers.length === 0) return 0;
    return Math.round(drivers.reduce((total, driver) => total + driver.safetyScore, 0) / drivers.length);
  }, [drivers]);

  const loadDrivers = async () => {
    setIsLoading(true);
    setServerError(null);

    try {
      const response = await getDrivers();
      setDrivers(response.data);
      if (selectedDriver) {
        setSelectedDriver(response.data.find((driver) => driver.id === selectedDriver.id) ?? null);
      }
    } catch (error) {
      setServerError(error as ApiErrorResponse);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadDrivers();
  }, []);

  useEffect(() => {
    if (!selectedDriver) {
      setSelectedTrend([]);
      return;
    }

    void getSafetyHistory(selectedDriver.id)
      .then((response) => setSelectedTrend(response.data.map((event) => event.score)))
      .catch(() => setSelectedTrend([]));
  }, [selectedDriver?.id]);

  const handleFieldChange = (name: keyof DriverFormValues, value: string) => {
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
    setServerError(null);
  };

  const startCreate = () => {
    setSelectedDriver(null);
    setValues(blankForm);
    setErrors({});
    setServerError(null);
  };

  const startEdit = (driver: Driver) => {
    setSelectedDriver(driver);
    setValues(toFormValues(driver));
    setErrors({});
    setServerError(null);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const nextErrors = validateDriver(values);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) return;

    setIsSaving(true);
    setServerError(null);

    try {
      const response = selectedDriver
        ? await updateDriver(selectedDriver, values)
        : await createDriver(values);
      setSelectedDriver(response.data);
      setValues(toFormValues(response.data));
      await loadDrivers();
    } catch (error) {
      const apiError = error as ApiErrorResponse;
      setServerError(apiError);
      if (apiError.field in values) {
        setErrors((current) => ({ ...current, [apiError.field]: apiError.message }));
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedDriver) return;

    setIsSaving(true);
    setServerError(null);

    try {
      await deleteDriver(selectedDriver);
      setSelectedDriver(null);
      setValues(blankForm);
      await loadDrivers();
    } catch (error) {
      setServerError(error as ApiErrorResponse);
    } finally {
      setIsSaving(false);
    }
  };

  const applyBulkStatus = async () => {
    if (!selectedIds.length || !window.confirm(`Change ${selectedIds.length} selected drivers to ${bulkStatus.replace("_", " ")}?`)) return;
    setIsSaving(true); try { await bulkUpdateDriverStatus(selectedIds, bulkStatus); setSelectedIds([]); await loadDrivers(); } catch (error) { setServerError(error as ApiErrorResponse); } finally { setIsSaving(false); }
  };

  return (
    <section className="mx-auto max-w-7xl px-4 py-7 lg:px-8">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Fleet & Compliance</p>
          <h2 className="mt-1 text-3xl font-semibold tracking-tight">Driver Management</h2>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => void loadDrivers()} type="button" variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button onClick={startCreate} type="button">
            <Plus className="mr-2 h-4 w-4" />
            Add Driver
          </Button>
        </div>
      </div>

      {selectedIds.length ? <div className="mb-4 flex flex-wrap items-center gap-3 rounded-[14px] border border-primary bg-panel px-4 py-3"><CheckSquare className="h-4 w-4 text-primary" /><span className="text-sm font-semibold">{selectedIds.length} selected</span><select className="h-9 rounded-md border border-border bg-background px-2 text-sm" onChange={(event) => setBulkStatus(event.target.value as DriverStatus)} value={bulkStatus}>{statuses.map((status) => <option key={status} value={status}>{status.replace("_", " ")}</option>)}</select><Button disabled={isSaving} onClick={() => void applyBulkStatus()} size="sm" type="button">Apply status</Button></div> : null}

      <div className="mb-6 grid gap-4 md:grid-cols-4">
        <div className="rounded-lg border border-border bg-raised p-5 shadow-card md:col-span-2 md:row-span-2">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-muted">Driver Bench</p>
              <p className="mt-3 text-5xl font-semibold tracking-tight">{drivers.length}</p>
            </div>
            <StatusBadge status="Available" />
          </div>
          <div className="mt-8 grid grid-cols-2 gap-3">
            <div className="rounded-md border border-border bg-surface p-3">
              <p className="text-xs uppercase tracking-wide text-muted">Available</p>
              <p className="mt-1 text-2xl font-semibold text-success">{availableCount}</p>
            </div>
            <div className="rounded-md border border-border bg-surface p-3">
              <p className="text-xs uppercase tracking-wide text-muted">Avg Safety</p>
              <p className="mt-1 text-2xl font-semibold">{averageSafetyScore}</p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-border bg-surface p-5 shadow-card">
          <p className="text-sm text-muted">Available</p>
          <p className="mt-2 text-4xl font-semibold tracking-tight text-success">{availableCount}</p>
        </div>
        <div className="rounded-lg border border-border bg-surface p-5 shadow-card">
          <p className="text-sm text-muted">Expiring Soon</p>
          <p className="mt-2 text-4xl font-semibold tracking-tight text-warning">{expiringSoonCount}</p>
        </div>
        <div className="rounded-lg border border-border bg-surface p-5 shadow-card md:col-span-2">
          <p className="text-sm text-muted">Suspended</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-danger">{suspendedCount}</p>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="overflow-hidden rounded-lg border border-border bg-surface shadow-card">
          <div className="border-b border-border px-5 py-4">
            <h3 className="text-base font-semibold">Drivers</h3>
          </div>

          {isLoading ? (
            <div className="space-y-3 p-5">
              {Array.from({ length: 5 }).map((_, index) => (
                <div className="h-12 animate-pulse rounded-md bg-panel" key={index} />
              ))}
            </div>
          ) : drivers.length === 0 ? (
            <div className="p-10 text-center">
              <p className="text-lg font-semibold">No drivers registered yet</p>
              <p className="mt-2 text-sm text-muted">Add the first driver to begin compliance setup.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] border-collapse text-left text-sm">
                <thead className="bg-panel text-xs uppercase tracking-wide text-muted">
                  <tr>
                    <th className="px-5 py-3 font-medium"><input aria-label="Select all drivers" checked={drivers.length > 0 && selectedIds.length === drivers.length} onChange={(event) => setSelectedIds(event.target.checked ? drivers.map((driver) => driver.id) : [])} type="checkbox" /></th>
                    <th className="px-5 py-3 font-medium">Driver</th>
                    <th className="px-5 py-3 font-medium">License</th>
                    <th className="px-5 py-3 font-medium">Expiry</th>
                    <th className="px-5 py-3 font-medium">Safety</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {drivers.map((driver) => (
                    <tr
                      className="cursor-pointer border-t border-border transition hover:bg-panel"
                      key={driver.id}
                      onClick={() => startEdit(driver)}
                    >
                      <td className="px-5 py-4" onClick={(event) => event.stopPropagation()}><input aria-label={`Select ${driver.name}`} checked={selectedIds.includes(driver.id)} onChange={(event) => setSelectedIds((current) => event.target.checked ? [...current, driver.id] : current.filter((id) => id !== driver.id))} type="checkbox" /></td>
                      <td className="px-5 py-4 font-semibold text-foreground">{driver.name}</td>
                      <td className="px-5 py-4 text-muted">{driver.licenseNumber}</td>
                      <td className="px-5 py-4 text-muted">
                        {new Date(driver.licenseExpiryDate).toLocaleDateString("en-IN")}
                      </td>
                      <td className="px-5 py-4 text-muted">{driver.safetyScore}</td>
                      <td className="px-5 py-4">
                        <StatusBadge status={driver.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <form className="rounded-lg border border-border bg-surface p-5 shadow-card" onSubmit={handleSubmit}>
          <div className="mb-5 flex items-start justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold">
                {selectedDriver ? "Driver Detail" : "Add Driver"}
              </h3>
              <p className="mt-1 text-sm text-muted">
                {selectedDriver ? selectedDriver.licenseNumber : "Create a driver compliance record"}
              </p>
            </div>
            {selectedDriver ? (
              <div className="min-w-[96px] text-right">
                <SafetySparkline scores={selectedTrend.length ? selectedTrend : [selectedDriver.safetyScore]} />
                <p className="mt-1 text-xs font-semibold text-muted">{selectedDriver.safetyScore} current</p>
              </div>
            ) : null}
            {selectedDriver ? (
              <Button aria-label="Clear selected driver" onClick={startCreate} size="icon" type="button" variant="ghost">
                <X className="h-4 w-4" />
              </Button>
            ) : null}
          </div>

          <div className="grid gap-4">
            <Field error={errors.name} label="Driver Name" name="name" onChange={handleFieldChange} value={values.name} />
            <Field
              error={errors.licenseNumber}
              label="License Number"
              name="licenseNumber"
              onChange={handleFieldChange}
              value={values.licenseNumber}
            />
            <Field
              error={errors.licenseCategory}
              label="License Category"
              name="licenseCategory"
              onChange={handleFieldChange}
              value={values.licenseCategory}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                error={errors.licenseExpiryDate}
                label="License Expiry"
                name="licenseExpiryDate"
                onChange={handleFieldChange}
                type="date"
                value={values.licenseExpiryDate}
              />
              <Field
                error={errors.safetyScore}
                label="Safety Score"
                name="safetyScore"
                onChange={handleFieldChange}
                type="number"
                value={values.safetyScore}
              />
            </div>
            <Field
              error={errors.contactNumber}
              label="Contact Number"
              name="contactNumber"
              onChange={handleFieldChange}
              value={values.contactNumber}
            />
            <label className="block">
              <span className="text-xs font-medium uppercase tracking-wide text-muted">Status</span>
              <select
                className="mt-2 h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary"
                onChange={(event) => handleFieldChange("status", event.target.value)}
                value={values.status}
              >
                {statuses.map((status) => (
                  <option key={status} value={status}>
                    {status.replace("_", " ")}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {serverError ? (
            <div className="mt-4 rounded-md border border-danger bg-background px-3 py-2 text-sm text-danger">
              {serverError.message}
            </div>
          ) : null}

          <div className="mt-5 flex flex-col gap-2 sm:flex-row">
            <Button disabled={isSaving} type="submit">
              <Save className="mr-2 h-4 w-4" />
              {isSaving ? "Saving..." : selectedDriver ? "Save Changes" : "Create Driver"}
            </Button>
            {selectedDriver ? (
              <Button disabled={isSaving} onClick={() => void handleDelete()} type="button" variant="outline">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            ) : null}
          </div>
        </form>
      </div>
    </section>
  );
};

