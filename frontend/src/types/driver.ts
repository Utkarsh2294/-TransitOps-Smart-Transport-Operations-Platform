export type DriverStatus = "Available" | "On_Trip" | "Off_Duty" | "Suspended";

export type Driver = {
  id: number;
  name: string;
  licenseNumber: string;
  licenseCategory: string;
  licenseExpiryDate: string;
  contactNumber: string;
  safetyScore: number;
  status: DriverStatus;
  createdAt: string;
};

export type DriverFormValues = {
  name: string;
  licenseNumber: string;
  licenseCategory: string;
  licenseExpiryDate: string;
  contactNumber: string;
  safetyScore: string;
  status: DriverStatus;
};

export type DriverListResponse = {
  data: Driver[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type DriverResponse = {
  data: Driver;
};

