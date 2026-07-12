import { DriverStatus, MaintenanceStatus, VehicleStatus } from "@prisma/client";

import { prisma } from "../config/prisma.js";

export type ComplianceAlert = {
  type: "license_expiring" | "license_expired" | "doc_expiring" | "doc_expired" | "maintenance_overdue" | "driver_suspended";
  severity: "high" | "medium" | "low";
  entityType: "driver" | "vehicle";
  entityId: number;
  entityLabel: string;
  detail: string;
  dueDate?: Date;
};

const severityOrder = { high: 0, medium: 1, low: 2 } as const;

export const getComplianceAlerts = async (): Promise<ComplianceAlert[]> => {
  const now = new Date();
  const inThirtyDays = new Date(now);
  inThirtyDays.setDate(now.getDate() + 30);
  const [expiringDrivers, suspendedDrivers, expiringDocuments, openMaintenance, serviceVehicles] = await prisma.$transaction([
    prisma.driver.findMany({ where: { licenseExpiryDate: { lte: inThirtyDays } }, select: { id: true, name: true, licenseExpiryDate: true } }),
    prisma.driver.findMany({ where: { status: DriverStatus.Suspended }, select: { id: true, name: true } }),
    prisma.vehicleDocument.findMany({ where: { expiryDate: { lte: inThirtyDays } }, include: { vehicle: { select: { id: true, regNumber: true, name: true } } } }),
    prisma.maintenanceLog.findMany({ where: { status: MaintenanceStatus.Open }, include: { vehicle: { select: { id: true, regNumber: true, name: true } } } }),
    prisma.vehicle.findMany({ where: { status: { not: VehicleStatus.Retired }, serviceIntervalKm: { not: null }, lastServiceOdometerKm: { not: null } }, select: { id: true, regNumber: true, name: true, odometerKm: true, serviceIntervalKm: true, lastServiceOdometerKm: true } }),
  ]);
  const alerts: ComplianceAlert[] = [
    ...expiringDrivers.map((driver) => ({ type: driver.licenseExpiryDate < now ? "license_expired" as const : "license_expiring" as const, severity: driver.licenseExpiryDate < now ? "high" as const : "medium" as const, entityType: "driver" as const, entityId: driver.id, entityLabel: driver.name, detail: `License expires ${driver.licenseExpiryDate.toLocaleDateString("en-IN")}`, dueDate: driver.licenseExpiryDate })),
    ...suspendedDrivers.map((driver) => ({ type: "driver_suspended" as const, severity: "high" as const, entityType: "driver" as const, entityId: driver.id, entityLabel: driver.name, detail: "Driver is suspended" })),
    ...expiringDocuments.map((document) => ({ type: document.expiryDate! < now ? "doc_expired" as const : "doc_expiring" as const, severity: document.expiryDate! < now ? "high" as const : "medium" as const, entityType: "vehicle" as const, entityId: document.vehicleId, entityLabel: `${document.vehicle.regNumber} - ${document.vehicle.name}`, detail: `${document.docType} expires ${document.expiryDate!.toLocaleDateString("en-IN")}`, dueDate: document.expiryDate! })),
    ...openMaintenance.map((log) => ({ type: "maintenance_overdue" as const, severity: "low" as const, entityType: "vehicle" as const, entityId: log.vehicleId, entityLabel: `${log.vehicle.regNumber} - ${log.vehicle.name}`, detail: `Open maintenance: ${log.type}`, dueDate: log.openedAt })),
    ...serviceVehicles.flatMap((vehicle) => {
      const dueInKm = vehicle.serviceIntervalKm! - (Number(vehicle.odometerKm) - Number(vehicle.lastServiceOdometerKm));
      return dueInKm < 0 ? [{ type: "maintenance_overdue" as const, severity: "high" as const, entityType: "vehicle" as const, entityId: vehicle.id, entityLabel: `${vehicle.regNumber} - ${vehicle.name}`, detail: `Service overdue by ${Math.abs(dueInKm).toLocaleString("en-IN")} km` }] : [];
    }),
  ];
  return alerts.sort((left, right) => severityOrder[left.severity] - severityOrder[right.severity] || (left.dueDate?.getTime() ?? Number.MAX_SAFE_INTEGER) - (right.dueDate?.getTime() ?? Number.MAX_SAFE_INTEGER));
};
