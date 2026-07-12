import { Plus, RefreshCw, Save, Trash2, X } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";

import { Button } from "../ui/Button";
import { StatusBadge } from "../ui/StatusBadge";
import { createVehicle, deleteVehicle, getVehicles, updateVehicle } from "../../lib/vehicles";
import type { ApiErrorResponse } from "../../lib/api";
import type { Vehicle, VehicleFormValues, VehicleStatus } from "../../types/vehicle";

const blankForm: VehicleFormValues = {
  regNumber: "",
  name: "",
  type: "",
  maxLoadCapacityKg: "",
  odometerKm: "0",
  acquisitionCost: "",
  status: "Available",
};

const statuses: VehicleStatus[] = ["Available", "On_Trip", "In_Shop", "Retired"];

const toFormValues = (vehicle: Vehicle): VehicleFormValues => ({
  regNumber: vehicle.regNumber,
  name: vehicle.name,
  type: vehicle.type,
  maxLoadCapacityKg: String(vehicle.maxLoadCapacityKg),
  odometerKm: String(vehicle.odometerKm),
  acquisitionCost: String(vehicle.acquisitionCost),
  status: vehicle.status,
});

const formatNumber = (value: number) =>
  new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(value);

const validateVehicle = (values: VehicleFormValues) => {
  const errors: Partial<Record<keyof VehicleFormValues, string>> = {};

  if (!values.regNumber.trim()) errors.regNumber = "Registration number is required";
  if (!values.name.trim()) errors.name = "Vehicle name is required";
  if (!values.type.trim()) errors.type = "Vehicle type is required";
  if (Number(values.maxLoadCapacityKg) <= 0) {
    errors.maxLoadCapacityKg = "Maximum load capacity must be positive";
  }
  if (Number(values.odometerKm) < 0) {
    errors.odometerKm = "Odometer cannot be negative";
  }
  if (Number(values.acquisitionCost) < 0 || !values.acquisitionCost) {
    errors.acquisitionCost = "Acquisition cost is required";
  }

  return errors;
};

type FieldProps = {
  error?: string;
  label: string;
  name: keyof VehicleFormValues;
  onChange: (name: keyof VehicleFormValues, value: string) => void;
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

export const VehicleRegistry = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [values, setValues] = useState<VehicleFormValues>(blankForm);
  const [errors, setErrors] = useState<Partial<Record<keyof VehicleFormValues, string>>>({});
  const [serverError, setServerError] = useState<ApiErrorResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const availableCount = useMemo(
    () => vehicles.filter((vehicle) => vehicle.status === "Available").length,
    [vehicles],
  );

  const loadVehicles = async () => {
    setIsLoading(true);
    setServerError(null);

    try {
      const response = await getVehicles();
      setVehicles(response.data);
      if (selectedVehicle) {
        setSelectedVehicle(response.data.find((vehicle) => vehicle.id === selectedVehicle.id) ?? null);
      }
    } catch (error) {
      setServerError(error as ApiErrorResponse);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadVehicles();
  }, []);

  const handleFieldChange = (name: keyof VehicleFormValues, value: string) => {
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
    setServerError(null);
  };

  const startCreate = () => {
    setSelectedVehicle(null);
    setValues(blankForm);
    setErrors({});
    setServerError(null);
  };

  const startEdit = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setValues(toFormValues(vehicle));
    setErrors({});
    setServerError(null);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const nextErrors = validateVehicle(values);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) return;

    setIsSaving(true);
    setServerError(null);

    try {
      const response = selectedVehicle
        ? await updateVehicle(selectedVehicle, values)
        : await createVehicle(values);
      setSelectedVehicle(response.data);
      setValues(toFormValues(response.data));
      await loadVehicles();
    } catch (error) {
      const apiError = error as ApiErrorResponse;
      setServerError(apiError);
      if (apiError.field in values) {
        setErrors((current) => ({
          ...current,
          [apiError.field]: apiError.message,
        }));
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedVehicle) return;

    setIsSaving(true);
    setServerError(null);

    try {
      await deleteVehicle(selectedVehicle);
      setSelectedVehicle(null);
      setValues(blankForm);
      await loadVehicles();
    } catch (error) {
      setServerError(error as ApiErrorResponse);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="mx-auto max-w-7xl px-4 py-6 lg:px-8">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm text-muted">Fleet & Compliance</p>
          <h2 className="mt-1 text-2xl font-semibold">Vehicle Registry</h2>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => void loadVehicles()} type="button" variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button onClick={startCreate} type="button">
            <Plus className="mr-2 h-4 w-4" />
            Add Vehicle
          </Button>
        </div>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-border bg-surface p-5 shadow-glow">
          <p className="text-sm text-muted">Total Vehicles</p>
          <p className="mt-2 text-3xl font-semibold">{vehicles.length}</p>
        </div>
        <div className="rounded-lg border border-border bg-surface p-5">
          <p className="text-sm text-muted">Available</p>
          <p className="mt-2 text-3xl font-semibold">{availableCount}</p>
        </div>
        <div className="rounded-lg border border-border bg-surface p-5">
          <p className="text-sm text-muted">In Shop / Retired</p>
          <p className="mt-2 text-3xl font-semibold">
            {vehicles.filter((vehicle) => vehicle.status === "In_Shop" || vehicle.status === "Retired").length}
          </p>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="overflow-hidden rounded-lg border border-border bg-surface">
          <div className="border-b border-border px-5 py-4">
            <h3 className="text-base font-semibold">Registry</h3>
          </div>

          {isLoading ? (
            <div className="space-y-3 p-5">
              {Array.from({ length: 5 }).map((_, index) => (
                <div className="h-12 animate-pulse rounded-md bg-panel" key={index} />
              ))}
            </div>
          ) : vehicles.length === 0 ? (
            <div className="p-10 text-center">
              <p className="text-lg font-semibold">No vehicles registered yet</p>
              <p className="mt-2 text-sm text-muted">Add the first vehicle to begin fleet setup.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] border-collapse text-left text-sm">
                <thead className="bg-panel text-xs uppercase tracking-wide text-muted">
                  <tr>
                    <th className="px-5 py-3 font-medium">Reg No.</th>
                    <th className="px-5 py-3 font-medium">Vehicle</th>
                    <th className="px-5 py-3 font-medium">Type</th>
                    <th className="px-5 py-3 font-medium">Capacity</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {vehicles.map((vehicle) => (
                    <tr
                      className="cursor-pointer border-t border-border transition hover:bg-panel/70"
                      key={vehicle.id}
                      onClick={() => startEdit(vehicle)}
                    >
                      <td className="px-5 py-4 font-medium text-white">{vehicle.regNumber}</td>
                      <td className="px-5 py-4 text-slate-300">{vehicle.name}</td>
                      <td className="px-5 py-4 text-slate-300">{vehicle.type}</td>
                      <td className="px-5 py-4 text-slate-300">
                        {formatNumber(vehicle.maxLoadCapacityKg)} kg
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge status={vehicle.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <form className="rounded-lg border border-border bg-surface p-5" onSubmit={handleSubmit}>
          <div className="mb-5 flex items-start justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold">
                {selectedVehicle ? "Vehicle Detail" : "Add Vehicle"}
              </h3>
              <p className="mt-1 text-sm text-muted">
                {selectedVehicle ? selectedVehicle.regNumber : "Create a new fleet asset"}
              </p>
            </div>
            {selectedVehicle ? (
              <Button aria-label="Clear selected vehicle" onClick={startCreate} size="icon" type="button" variant="ghost">
                <X className="h-4 w-4" />
              </Button>
            ) : null}
          </div>

          <div className="grid gap-4">
            <Field
              error={errors.regNumber}
              label="Registration Number"
              name="regNumber"
              onChange={handleFieldChange}
              value={values.regNumber}
            />
            <Field
              error={errors.name}
              label="Vehicle Name"
              name="name"
              onChange={handleFieldChange}
              value={values.name}
            />
            <Field
              error={errors.type}
              label="Type"
              name="type"
              onChange={handleFieldChange}
              value={values.type}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                error={errors.maxLoadCapacityKg}
                label="Max Load Kg"
                name="maxLoadCapacityKg"
                onChange={handleFieldChange}
                type="number"
                value={values.maxLoadCapacityKg}
              />
              <Field
                error={errors.odometerKm}
                label="Odometer Km"
                name="odometerKm"
                onChange={handleFieldChange}
                type="number"
                value={values.odometerKm}
              />
            </div>
            <Field
              error={errors.acquisitionCost}
              label="Acquisition Cost"
              name="acquisitionCost"
              onChange={handleFieldChange}
              type="number"
              value={values.acquisitionCost}
            />
            <label className="block">
              <span className="text-xs font-medium uppercase tracking-wide text-muted">Status</span>
              <select
                className="mt-2 h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none transition focus:border-primary"
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
            <div className="mt-4 rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-red-200">
              {serverError.message}
            </div>
          ) : null}

          <div className="mt-5 flex flex-col gap-2 sm:flex-row">
            <Button disabled={isSaving} type="submit">
              <Save className="mr-2 h-4 w-4" />
              {isSaving ? "Saving..." : selectedVehicle ? "Save Changes" : "Create Vehicle"}
            </Button>
            {selectedVehicle ? (
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

