import { apiRequest } from "./api";
import type { FleetDashboardReport, VehicleCostReportRow } from "../types/report";

type ApiResponse<T> = {
  data: T;
};

export const getFleetDashboardReport = () =>
  apiRequest<ApiResponse<FleetDashboardReport>>("/reports/dashboard");

export const getVehicleCostReport = () =>
  apiRequest<ApiResponse<VehicleCostReportRow[]>>("/reports/vehicle-costs");

export const downloadVehicleCostReportCsv = async () => {
  const baseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000/api";
  const demoToken = import.meta.env.VITE_DEMO_TOKEN;
  const response = await fetch(`${baseUrl}/reports/vehicle-costs.csv`, {
    headers: {
      ...(demoToken ? { Authorization: `Bearer ${demoToken}` } : {}),
    },
  });

  if (!response.ok) {
    throw new Error("CSV export failed");
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "vehicle-cost-report.csv";
  anchor.click();
  URL.revokeObjectURL(url);
};
