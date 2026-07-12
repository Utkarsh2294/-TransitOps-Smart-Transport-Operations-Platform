import { apiRequest } from "./api";
import type {
  ExpenseFormValues,
  ExpenseListResponse,
  ExpenseResponse,
  FuelLogFormValues,
  FuelLogListResponse,
  FuelLogResponse,
} from "../types/finance";

const toFuelLogPayload = (values: FuelLogFormValues) => ({
  vehicleId: Number(values.vehicleId),
  tripId: values.tripId ? Number(values.tripId) : undefined,
  liters: Number(values.liters),
  cost: Number(values.cost),
  date: values.date || undefined,
});

const toExpensePayload = (values: ExpenseFormValues) => ({
  vehicleId: Number(values.vehicleId),
  category: values.category,
  amount: Number(values.amount),
  date: values.date || undefined,
  note: values.note.trim() || undefined,
});

export const getFuelLogs = (page = 1, limit = 20) =>
  apiRequest<FuelLogListResponse>(`/finance/fuel-logs?page=${page}&limit=${limit}`);

export const createFuelLog = (values: FuelLogFormValues) =>
  apiRequest<FuelLogResponse>("/finance/fuel-logs", {
    method: "POST",
    body: JSON.stringify(toFuelLogPayload(values)),
  });

export const getExpenses = (page = 1, limit = 20) =>
  apiRequest<ExpenseListResponse>(`/finance/expenses?page=${page}&limit=${limit}`);

export const createExpense = (values: ExpenseFormValues) =>
  apiRequest<ExpenseResponse>("/finance/expenses", {
    method: "POST",
    body: JSON.stringify(toExpensePayload(values)),
  });

