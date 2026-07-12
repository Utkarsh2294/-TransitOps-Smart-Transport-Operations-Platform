export type MaintenanceStatus = "Open" | "Closed";

export type MaintenanceLog = {
  id: number;
  vehicleId: number;
  type: string;
  cost: number;
  status: MaintenanceStatus;
  openedAt: string;
  closedAt: string | null;
  vehicle?: {
    id: number;
    regNumber: string;
    name: string;
    status: string;
  };
};

export type MaintenanceListResponse = {
  data: MaintenanceLog[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type MaintenanceResponse = {
  data: MaintenanceLog;
};
