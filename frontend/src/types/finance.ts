export type ExpenseCategory = "toll" | "fine" | "other";

export type FuelLog = {
  id: number;
  vehicleId: number;
  tripId: number | null;
  liters: number;
  cost: number;
  date: string;
};

export type Expense = {
  id: number;
  vehicleId: number;
  category: ExpenseCategory;
  amount: number;
  date: string;
  note: string | null;
};

export type FuelLogFormValues = {
  vehicleId: string;
  tripId: string;
  liters: string;
  cost: string;
  date: string;
};

export type ExpenseFormValues = {
  vehicleId: string;
  category: ExpenseCategory;
  amount: string;
  date: string;
  note: string;
};

export type FuelLogListResponse = {
  data: FuelLog[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type ExpenseListResponse = {
  data: Expense[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type FuelLogResponse = {
  data: FuelLog;
};

export type ExpenseResponse = {
  data: Expense;
};

