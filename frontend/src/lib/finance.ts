import { apiRequest } from "./api";
import type {
  ExpenseFormValues,
  ExpenseListResponse,
  ExpenseResponse,
  FuelLogFormValues,
  FuelLogListResponse,
  FuelLogResponse,
} from "../types/finance";

const toFuelLogPayload = (values: FuelLogFormValues) => {
  const data: any = {
    vehicleId: Number(values.vehicleId),
    liters: Number(values.liters),
    cost: Number(values.cost),
  };
  if (values.tripId) data.tripId = Number(values.tripId);
  if (values.date) data.date = values.date;
  return data;
};

const toExpensePayload = (values: ExpenseFormValues) => {
  const data: any = {
    vehicleId: Number(values.vehicleId),
    category: values.category,
    amount: Number(values.amount),
  };
  if (values.date) data.date = values.date;
  if (values.note && values.note.trim()) data.note = values.note.trim();
  return data;
};

export const getFuelLogs = (page = 1, limit = 20) =>
  apiRequest<FuelLogListResponse>(`/finance/fuel-logs?page=${page}&limit=${limit}`);

export const createFuelLog = (values: FuelLogFormValues & { receipt?: File | null }) => {
  if (values.receipt) {
    const formData = new FormData();
    const payload = toFuelLogPayload(values);
    Object.entries(payload).forEach(([k, v]) => formData.append(k, String(v)));
    formData.append("receipt", values.receipt);
    return apiRequest<FuelLogResponse>("/finance/fuel-logs", { method: "POST", body: formData });
  }
  return apiRequest<FuelLogResponse>("/finance/fuel-logs", {
    method: "POST",
    body: JSON.stringify(toFuelLogPayload(values)),
  });
};

export const getExpenses = (page = 1, limit = 20) =>
  apiRequest<ExpenseListResponse>(`/finance/expenses?page=${page}&limit=${limit}`);

export const createExpense = (values: ExpenseFormValues & { receipt?: File | null }) => {
  if (values.receipt) {
    const formData = new FormData();
    const payload = toExpensePayload(values);
    Object.entries(payload).forEach(([k, v]) => formData.append(k, String(v)));
    formData.append("receipt", values.receipt);
    return apiRequest<ExpenseResponse>("/finance/expenses", { method: "POST", body: formData });
  }
  return apiRequest<ExpenseResponse>("/finance/expenses", {
    method: "POST",
    body: JSON.stringify(toExpensePayload(values)),
  });
};

