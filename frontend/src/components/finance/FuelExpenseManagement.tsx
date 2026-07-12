import { Fuel, Plus, ReceiptText, RefreshCw, Paperclip, Play } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";

import { apiRequest } from "../../lib/api";
import type { ApiErrorResponse } from "../../lib/api";
import { createExpense, createFuelLog, getExpenses, getFuelLogs } from "../../lib/finance";
import { getTrips } from "../../lib/trips";
import { getVehicles } from "../../lib/vehicles";
import type { Expense, ExpenseCategory, ExpenseFormValues, FuelLog, FuelLogFormValues } from "../../types/finance";
import type { Trip } from "../../types/trip";
import type { Vehicle } from "../../types/vehicle";
import { Button } from "../ui/Button";

const today = () => new Date().toISOString().slice(0, 10);

const blankFuelForm: FuelLogFormValues & { receipt?: File | null } = {
  vehicleId: "",
  tripId: "",
  liters: "",
  cost: "",
  date: today(),
  receipt: null,
};

const blankExpenseForm: ExpenseFormValues & { receipt?: File | null } = {
  vehicleId: "",
  category: "toll",
  amount: "",
  date: today(),
  note: "",
  receipt: null,
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    currency: "INR",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(value);

const formatNumber = (value: number) =>
  new Intl.NumberFormat("en-IN", { maximumFractionDigits: 1 }).format(value);

const categories: ExpenseCategory[] = ["toll", "fine", "other"];

export const FuelExpenseManagement = () => {
  const [fuelLogs, setFuelLogs] = useState<FuelLog[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [recurringExpenses, setRecurringExpenses] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  
  const [fuelValues, setFuelValues] = useState<FuelLogFormValues & { receipt?: File | null }>(blankFuelForm);
  const [expenseValues, setExpenseValues] = useState<ExpenseFormValues & { receipt?: File | null }>(blankExpenseForm);
  
  const [serverError, setServerError] = useState<ApiErrorResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTriggering, setIsTriggering] = useState(false);

  const fuelCost = useMemo(
    () => fuelLogs.reduce((total, fuelLog) => total + fuelLog.cost, 0),
    [fuelLogs],
  );
  const expenseCost = useMemo(
    () => expenses.reduce((total, expense) => total + expense.amount, 0),
    [expenses],
  );
  const totalLiters = useMemo(
    () => fuelLogs.reduce((total, fuelLog) => total + fuelLog.liters, 0),
    [fuelLogs],
  );

  const loadData = async () => {
    setIsLoading(true);
    setServerError(null);

    try {
      const [fuelResponse, expenseResponse, vehicleResponse, tripResponse, recurringResponse] = await Promise.all([
        getFuelLogs(),
        getExpenses(),
        getVehicles(1),
        getTrips(1, 100),
        apiRequest<any>("/finance/recurring-expenses")
      ]);
      setFuelLogs(fuelResponse.data);
      setExpenses(expenseResponse.data);
      setVehicles(vehicleResponse.data);
      setTrips(tripResponse.data);
      setRecurringExpenses(recurringResponse.data);
    } catch (error) {
      setServerError(error as ApiErrorResponse);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const getVehicleLabel = (vehicleId: number) => {
    const vehicle = vehicles.find((item) => item.id === vehicleId);
    return vehicle ? `${vehicle.regNumber} · ${vehicle.name}` : `Vehicle #${vehicleId}`;
  };

  const handleFuelSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setIsSaving(true);
    setServerError(null);

    try {
      await createFuelLog(fuelValues);
      setFuelValues(blankFuelForm);
      await loadData();
    } catch (error) {
      setServerError(error as ApiErrorResponse);
    } finally {
      setIsSaving(false);
    }
  };

  const handleExpenseSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setIsSaving(true);
    setServerError(null);

    try {
      await createExpense(expenseValues);
      setExpenseValues(blankExpenseForm);
      await loadData();
    } catch (error) {
      setServerError(error as ApiErrorResponse);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTriggerRecurring = async () => {
    setIsTriggering(true);
    try {
      await apiRequest("/finance/recurring-expenses/trigger", { method: "POST" });
      await loadData();
    } catch (error) {
      setServerError(error as ApiErrorResponse);
    } finally {
      setIsTriggering(false);
    }
  };

  return (
    <section className="mx-auto max-w-7xl px-4 py-6 lg:px-8">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm text-muted">Operations & Analytics</p>
          <h2 className="mt-1 text-2xl font-semibold">Fuel & Expenses</h2>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => void handleTriggerRecurring()} disabled={isTriggering} type="button" variant="outline">
            <Play className="mr-2 h-4 w-4" /> Trigger Recurring
          </Button>
          <Button onClick={() => void loadData()} type="button" variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" /> Refresh
          </Button>
        </div>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-4">
        <div className="rounded-lg border border-border bg-surface p-5 shadow-glow">
          <p className="text-sm text-muted">Fuel Cost</p>
          <p className="mt-2 text-3xl font-semibold">{formatCurrency(fuelCost)}</p>
        </div>
        <div className="rounded-lg border border-border bg-surface p-5">
          <p className="text-sm text-muted">Other Expenses</p>
          <p className="mt-2 text-3xl font-semibold">{formatCurrency(expenseCost)}</p>
        </div>
        <div className="rounded-lg border border-border bg-surface p-5">
          <p className="text-sm text-muted">Fuel Logged</p>
          <p className="mt-2 text-3xl font-semibold">{formatNumber(totalLiters)} L</p>
        </div>
        <div className="rounded-lg border border-border bg-surface p-5">
          <p className="text-sm text-muted">Records</p>
          <p className="mt-2 text-3xl font-semibold">{fuelLogs.length + expenses.length}</p>
        </div>
      </div>

      {serverError ? (
        <div className="mb-6 rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-red-200">
          {serverError.message}
        </div>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-[420px_minmax(0,1fr)]">
        <div className="space-y-5">
          <form className="rounded-lg border border-border bg-surface p-5" onSubmit={handleFuelSubmit}>
            <div className="mb-5 flex items-center gap-2">
              <Fuel className="h-5 w-5 text-primary" />
              <div>
                <h3 className="text-base font-semibold">Record Fuel</h3>
                <p className="text-sm text-muted">Log liters and cost against a vehicle.</p>
              </div>
            </div>
            <div className="grid gap-4">
              <label className="block">
                <span className="text-xs font-medium uppercase tracking-wide text-muted">Vehicle</span>
                <select
                  className="mt-2 h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none transition focus:border-primary"
                  onChange={(event) => setFuelValues((current) => ({ ...current, vehicleId: event.target.value }))}
                  required
                  value={fuelValues.vehicleId}
                >
                  <option value="">Select vehicle</option>
                  {vehicles.map((vehicle) => (
                    <option key={vehicle.id} value={vehicle.id}>
                      {vehicle.regNumber} · {vehicle.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-xs font-medium uppercase tracking-wide text-muted">Trip</span>
                <select
                  className="mt-2 h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none transition focus:border-primary"
                  onChange={(event) => setFuelValues((current) => ({ ...current, tripId: event.target.value }))}
                  value={fuelValues.tripId}
                >
                  <option value="">No trip link</option>
                  {trips.map((trip) => (
                    <option key={trip.id} value={trip.id}>
                      #{trip.id} · {trip.source} to {trip.destination}
                    </option>
                  ))}
                </select>
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <input
                  className="h-10 rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none transition focus:border-primary"
                  onChange={(event) => setFuelValues((current) => ({ ...current, liters: event.target.value }))}
                  placeholder="Liters"
                  required
                  type="number"
                  value={fuelValues.liters}
                />
                <input
                  className="h-10 rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none transition focus:border-primary"
                  onChange={(event) => setFuelValues((current) => ({ ...current, cost: event.target.value }))}
                  placeholder="Cost"
                  required
                  type="number"
                  value={fuelValues.cost}
                />
              </div>
              <input
                className="h-10 rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none transition focus:border-primary"
                onChange={(event) => setFuelValues((current) => ({ ...current, date: event.target.value }))}
                type="date"
                value={fuelValues.date}
              />
              <label className="block">
                <span className="text-xs font-medium uppercase tracking-wide text-muted">Receipt</span>
                <input
                  type="file"
                  accept="image/png, image/jpeg, application/pdf"
                  className="mt-2 block w-full text-sm text-muted file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-background hover:file:opacity-90"
                  onChange={(e) => setFuelValues(cur => ({ ...cur, receipt: e.target.files?.[0] || null }))}
                />
              </label>
            </div>
            <Button className="mt-5 w-full" disabled={isSaving} type="submit">
              <Plus className="mr-2 h-4 w-4" />
              Add Fuel Log
            </Button>
          </form>

          <form className="rounded-lg border border-border bg-surface p-5" onSubmit={handleExpenseSubmit}>
            <div className="mb-5 flex items-center gap-2">
              <ReceiptText className="h-5 w-5 text-primary" />
              <div>
                <h3 className="text-base font-semibold">Record Expense</h3>
                <p className="text-sm text-muted">Track tolls, fines, and other costs.</p>
              </div>
            </div>
            <div className="grid gap-4">
              <label className="block">
                <span className="text-xs font-medium uppercase tracking-wide text-muted">Vehicle</span>
                <select
                  className="mt-2 h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none transition focus:border-primary"
                  onChange={(event) => setExpenseValues((current) => ({ ...current, vehicleId: event.target.value }))}
                  required
                  value={expenseValues.vehicleId}
                >
                  <option value="">Select vehicle</option>
                  {vehicles.map((vehicle) => (
                    <option key={vehicle.id} value={vehicle.id}>
                      {vehicle.regNumber} · {vehicle.name}
                    </option>
                  ))}
                </select>
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <select
                  className="h-10 rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none transition focus:border-primary"
                  onChange={(event) =>
                    setExpenseValues((current) => ({ ...current, category: event.target.value as ExpenseCategory }))
                  }
                  value={expenseValues.category}
                >
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
                <input
                  className="h-10 rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none transition focus:border-primary"
                  onChange={(event) => setExpenseValues((current) => ({ ...current, amount: event.target.value }))}
                  placeholder="Amount"
                  required
                  type="number"
                  value={expenseValues.amount}
                />
              </div>
              <input
                className="h-10 rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none transition focus:border-primary"
                onChange={(event) => setExpenseValues((current) => ({ ...current, date: event.target.value }))}
                type="date"
                value={expenseValues.date}
              />
              <textarea
                className="min-h-20 rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition placeholder:text-muted focus:border-primary"
                onChange={(event) => setExpenseValues((current) => ({ ...current, note: event.target.value }))}
                placeholder="Note"
                value={expenseValues.note}
              />
              <label className="block">
                <span className="text-xs font-medium uppercase tracking-wide text-muted">Receipt</span>
                <input
                  type="file"
                  accept="image/png, image/jpeg, application/pdf"
                  className="mt-2 block w-full text-sm text-muted file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-background hover:file:opacity-90"
                  onChange={(e) => setExpenseValues(cur => ({ ...cur, receipt: e.target.files?.[0] || null }))}
                />
              </label>
            </div>
            <Button className="mt-5 w-full" disabled={isSaving} type="submit">
              <Plus className="mr-2 h-4 w-4" />
              Add Expense
            </Button>
          </form>
        </div>

        <div className="grid gap-5">
          <div className="overflow-hidden rounded-lg border border-border bg-surface">
            <div className="border-b border-border px-5 py-4">
              <h3 className="text-base font-semibold">Fuel Logs</h3>
            </div>
            {isLoading ? (
              <div className="space-y-3 p-5">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div className="h-12 animate-pulse rounded-md bg-panel" key={index} />
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto max-h-[300px]">
                <table className="w-full min-w-[680px] border-collapse text-left text-sm">
                  <thead className="bg-panel text-xs uppercase tracking-wide text-muted sticky top-0">
                    <tr>
                      <th className="px-5 py-3 font-medium">Vehicle</th>
                      <th className="px-5 py-3 font-medium">Liters</th>
                      <th className="px-5 py-3 font-medium">Cost</th>
                      <th className="px-5 py-3 font-medium">Date</th>
                      <th className="px-5 py-3 font-medium">Receipt</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fuelLogs.map((fuelLog: any) => (
                      <tr className="border-t border-border" key={fuelLog.id}>
                        <td className="px-5 py-4 font-medium text-foreground">{getVehicleLabel(fuelLog.vehicleId)}</td>
                        <td className="px-5 py-4 text-muted">{formatNumber(fuelLog.liters)} L</td>
                        <td className="px-5 py-4 text-muted">{formatCurrency(fuelLog.cost)}</td>
                        <td className="px-5 py-4 text-muted">
                          {new Date(fuelLog.date).toLocaleDateString("en-IN")}
                        </td>
                        <td className="px-5 py-4">
                          {fuelLog.receiptUrl ? (
                            <a href={fuelLog.receiptUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline flex items-center gap-1">
                              <Paperclip className="h-4 w-4" /> View
                            </a>
                          ) : (
                            <span className="text-muted text-xs">No receipt</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="overflow-hidden rounded-lg border border-border bg-surface">
            <div className="border-b border-border px-5 py-4">
              <h3 className="text-base font-semibold">Expenses</h3>
            </div>
            <div className="overflow-x-auto max-h-[300px]">
              <table className="w-full min-w-[680px] border-collapse text-left text-sm">
                <thead className="bg-panel text-xs uppercase tracking-wide text-muted sticky top-0">
                  <tr>
                    <th className="px-5 py-3 font-medium">Vehicle</th>
                    <th className="px-5 py-3 font-medium">Category</th>
                    <th className="px-5 py-3 font-medium">Amount</th>
                    <th className="px-5 py-3 font-medium">Date</th>
                    <th className="px-5 py-3 font-medium">Receipt</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map((expense: any) => (
                    <tr className="border-t border-border" key={expense.id}>
                      <td className="px-5 py-4 font-medium text-foreground">{getVehicleLabel(expense.vehicleId)}</td>
                      <td className="px-5 py-4 text-muted">{expense.category}</td>
                      <td className="px-5 py-4 text-muted">{formatCurrency(expense.amount)}</td>
                      <td className="px-5 py-4 text-muted">
                        {new Date(expense.date).toLocaleDateString("en-IN")}
                      </td>
                      <td className="px-5 py-4">
                        {expense.receiptUrl ? (
                          <a href={expense.receiptUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline flex items-center gap-1">
                            <Paperclip className="h-4 w-4" /> View
                          </a>
                        ) : (
                          <span className="text-muted text-xs">No receipt</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recurring Expenses Table */}
          <div className="overflow-hidden rounded-lg border border-border bg-surface">
            <div className="border-b border-border px-5 py-4">
              <h3 className="text-base font-semibold">Recurring Expenses</h3>
            </div>
            <div className="overflow-x-auto max-h-[300px]">
              <table className="w-full border-collapse text-left text-sm">
                <thead className="bg-panel text-xs uppercase tracking-wide text-muted sticky top-0">
                  <tr>
                    <th className="px-5 py-3 font-medium">Vehicle</th>
                    <th className="px-5 py-3 font-medium">Type</th>
                    <th className="px-5 py-3 font-medium">Amount</th>
                    <th className="px-5 py-3 font-medium">Next Due</th>
                  </tr>
                </thead>
                <tbody>
                  {recurringExpenses.map((r: any) => (
                    <tr className="border-t border-border" key={r.id}>
                      <td className="px-5 py-4 font-medium text-foreground">{getVehicleLabel(r.vehicleId)}</td>
                      <td className="px-5 py-4 text-muted uppercase">{r.expenseType}</td>
                      <td className="px-5 py-4 text-muted">{formatCurrency(r.amount)}</td>
                      <td className="px-5 py-4 text-muted">
                        {new Date(r.nextDueDate).toLocaleDateString("en-IN")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
        </div>
      </div>
    </section>
  );
};
