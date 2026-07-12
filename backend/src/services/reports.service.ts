import { TripStatus, VehicleStatus } from "@prisma/client";

import { prisma } from "../config/prisma.js";
import path from "node:path";
import PDFDocument from "pdfkit";
import { getComplianceAlerts } from "./safety.service.js";

type VehicleCostRow = {
  vehicleId: number;
  regNumber: string;
  name: string;
  status: VehicleStatus;
  acquisitionCost: number;
  fuelLiters: number;
  fuelCost: number;
  maintenanceCost: number;
  expenseCost: number;
  totalOperationalCost: number;
  completedTrips: number;
  completedDistanceKm: number;
  fuelEfficiencyKmPerLiter: number | null;
  roiPercent: number | null;
};

const round = (value: number, precision = 2) => Number(value.toFixed(precision));

const escapeCsv = (value: string | number | null) => {
  if (value === null) {
    return "";
  }

  const stringValue = String(value);
  if (!/[",\n]/.test(stringValue)) {
    return stringValue;
  }

  return `"${stringValue.replace(/"/g, '""')}"`;
};

export const getFleetDashboardReport = async () => {
  const [
    totalVehicles,
    activeVehicles,
    availableVehicles,
    maintenanceVehicles,
    retiredVehicles,
    activeTrips,
    pendingTrips,
    driversOnDuty,
    completedTrips,
    fuelTotals,
    maintenanceTotals,
    expenseTotals,
  ] = await prisma.$transaction([
    prisma.vehicle.count(),
    prisma.vehicle.count({ where: { status: VehicleStatus.On_Trip } }),
    prisma.vehicle.count({ where: { status: VehicleStatus.Available } }),
    prisma.vehicle.count({ where: { status: VehicleStatus.In_Shop } }),
    prisma.vehicle.count({ where: { status: VehicleStatus.Retired } }),
    prisma.trip.count({ where: { status: TripStatus.Dispatched } }),
    prisma.trip.count({ where: { status: TripStatus.Draft } }),
    prisma.driver.count({ where: { status: "On_Trip" } }),
    prisma.trip.aggregate({
      where: { status: TripStatus.Completed },
      _sum: {
        plannedDistanceKm: true,
        fuelConsumedLiters: true,
      },
    }),
    prisma.fuelLog.aggregate({
      _sum: {
        liters: true,
        cost: true,
      },
    }),
    prisma.maintenanceLog.aggregate({
      _sum: { cost: true },
    }),
    prisma.expense.aggregate({
      _sum: { amount: true },
    }),
  ]);

  const serviceableVehicles = totalVehicles - retiredVehicles;
  const completedDistanceKm = Number(completedTrips._sum.plannedDistanceKm ?? 0);
  const completedFuelLiters = Number(completedTrips._sum.fuelConsumedLiters ?? 0);
  const fleetUtilizationPercent =
    serviceableVehicles === 0 ? 0 : round((activeVehicles / serviceableVehicles) * 100);
  const totalFuelCost = Number(fuelTotals._sum.cost ?? 0);
  const totalMaintenanceCost = Number(maintenanceTotals._sum.cost ?? 0);
  const totalExpenseCost = Number(expenseTotals._sum.amount ?? 0);

  return {
    kpis: {
      totalVehicles,
      activeVehicles,
      availableVehicles,
      maintenanceVehicles,
      activeTrips,
      pendingTrips,
      driversOnDuty,
      fleetUtilizationPercent,
    },
    analytics: {
      fuelLiters: Number(fuelTotals._sum.liters ?? 0),
      fuelCost: totalFuelCost,
      maintenanceCost: totalMaintenanceCost,
      expenseCost: totalExpenseCost,
      totalOperationalCost: totalFuelCost + totalMaintenanceCost + totalExpenseCost,
      completedDistanceKm,
      fuelEfficiencyKmPerLiter:
        completedFuelLiters === 0 ? null : round(completedDistanceKm / completedFuelLiters),
    },
  };
};

export const getVehicleCostReport = async (): Promise<VehicleCostRow[]> => {
  const vehicles = await prisma.vehicle.findMany({
    orderBy: { regNumber: "asc" },
    include: {
      fuelLogs: {
        select: {
          liters: true,
          cost: true,
        },
      },
      maintenanceLogs: {
        select: {
          cost: true,
        },
      },
      expenses: {
        select: {
          amount: true,
        },
      },
      trips: {
        where: { status: TripStatus.Completed },
        select: {
          plannedDistanceKm: true,
          fuelConsumedLiters: true,
        },
      },
    },
  });

  return vehicles.map((vehicle) => {
    const fuelLiters = vehicle.fuelLogs.reduce(
      (total, fuelLog) => total + Number(fuelLog.liters),
      0,
    );
    const fuelCost = vehicle.fuelLogs.reduce(
      (total, fuelLog) => total + Number(fuelLog.cost),
      0,
    );
    const maintenanceCost = vehicle.maintenanceLogs.reduce(
      (total, maintenanceLog) => total + Number(maintenanceLog.cost),
      0,
    );
    const expenseCost = vehicle.expenses.reduce(
      (total, expense) => total + Number(expense.amount),
      0,
    );
    const completedDistanceKm = vehicle.trips.reduce(
      (total, trip) => total + Number(trip.plannedDistanceKm),
      0,
    );
    const completedFuelLiters = vehicle.trips.reduce(
      (total, trip) => total + Number(trip.fuelConsumedLiters ?? 0),
      0,
    );
    const totalOperationalCost = fuelCost + maintenanceCost + expenseCost;
    const acquisitionCost = Number(vehicle.acquisitionCost);

    return {
      vehicleId: vehicle.id,
      regNumber: vehicle.regNumber,
      name: vehicle.name,
      status: vehicle.status,
      acquisitionCost,
      fuelLiters: round(fuelLiters),
      fuelCost: round(fuelCost),
      maintenanceCost: round(maintenanceCost),
      expenseCost: round(expenseCost),
      totalOperationalCost: round(totalOperationalCost),
      completedTrips: vehicle.trips.length,
      completedDistanceKm: round(completedDistanceKm),
      fuelEfficiencyKmPerLiter:
        completedFuelLiters === 0 ? null : round(completedDistanceKm / completedFuelLiters),
      roiPercent:
        acquisitionCost === 0 ? null : round(((0 - totalOperationalCost) / acquisitionCost) * 100),
    };
  });
};

export const getVehicleCostReportCsv = async () => {
  const rows = await getVehicleCostReport();
  const headers = [
    "vehicleId",
    "regNumber",
    "name",
    "status",
    "fuelLiters",
    "fuelCost",
    "maintenanceCost",
    "expenseCost",
    "totalOperationalCost",
    "completedTrips",
    "completedDistanceKm",
    "fuelEfficiencyKmPerLiter",
    "roiPercent",
  ];

  return [
    headers.join(","),
    ...rows.map((row) =>
      headers.map((header) => escapeCsv(row[header as keyof VehicleCostRow])).join(","),
    ),
  ].join("\n");
};

export const getCompliancePdf = async () => {
  const [vehicles, drivers, maintenance, alerts] = await Promise.all([
    prisma.vehicle.findMany({ orderBy: { regNumber: "asc" }, select: { regNumber: true, name: true, status: true } }),
    prisma.driver.findMany({ orderBy: { name: "asc" }, select: { name: true, licenseNumber: true, licenseExpiryDate: true, status: true } }),
    prisma.maintenanceLog.findMany({ where: { status: "Open" }, include: { vehicle: { select: { regNumber: true } } }, orderBy: { openedAt: "asc" } }),
    getComplianceAlerts(),
  ]);
  const pdf = new PDFDocument({ margin: 42, size: "A4" });
  const chunks: Buffer[] = [];
  pdf.on("data", (chunk: Buffer) => chunks.push(chunk));
  const done = new Promise<Buffer>((resolve, reject) => {
    pdf.on("end", () => resolve(Buffer.concat(chunks)));
    pdf.on("error", reject);
  });
  const title = (value: string) => { pdf.moveDown(0.8).fontSize(14).fillColor("#0f766e").text(value); pdf.moveDown(0.25).fillColor("#111827"); };
  pdf.fontSize(22).fillColor("#111827").text("TransitOps Compliance Report");
  pdf.fontSize(9).fillColor("#667085").text(`Generated ${new Date().toLocaleString("en-IN")}`);
  title("Fleet roster");
  vehicles.forEach((vehicle) => pdf.fontSize(9).text(`${vehicle.regNumber} | ${vehicle.name} | ${vehicle.status.replace("_", " ")}`));
  title("Driver roster");
  drivers.forEach((driver) => pdf.fontSize(9).text(`${driver.name} | ${driver.licenseNumber} | Expires ${driver.licenseExpiryDate.toLocaleDateString("en-IN")} | ${driver.status.replace("_", " ")}`));
  title("Active maintenance");
  maintenance.length ? maintenance.forEach((log) => pdf.fontSize(9).text(`${log.vehicle.regNumber} | ${log.type} | Opened ${log.openedAt.toLocaleDateString("en-IN")}`)) : pdf.fontSize(9).text("No active maintenance logs.");
  title("Current alerts");
  alerts.length ? alerts.forEach((alert) => pdf.fontSize(9).text(`[${alert.severity.toUpperCase()}] ${alert.entityLabel}: ${alert.detail}`)) : pdf.fontSize(9).text("No active compliance alerts.");
  pdf.end();
  return done;
};


export const getFuelAnomalies = async () => {
  const vehicleCosts = await getVehicleCostReport();
  const anomalies = [];
  
  for (const vc of vehicleCosts) {
    if (!vc.fuelEfficiencyKmPerLiter) continue;
    
    // Find completed trips for this vehicle
    const trips = await prisma.trip.findMany({
      where: { vehicleId: vc.vehicleId, status: 'Completed', fuelConsumedLiters: { not: null }, plannedDistanceKm: { gt: 0 } },
      orderBy: { id: 'desc' }
    });
    
    for (const trip of trips) {
      const actualEfficiency = Number(trip.plannedDistanceKm) / Number(trip.fuelConsumedLiters);
      if (actualEfficiency < vc.fuelEfficiencyKmPerLiter * 0.85) {
        anomalies.push({
          vehicleId: vc.vehicleId,
          regNumber: vc.regNumber,
          tripId: trip.id,
          date: trip.createdAt,
          actualEfficiency: round(actualEfficiency),
          expectedEfficiency: vc.fuelEfficiencyKmPerLiter,
          deviationPercent: round(((vc.fuelEfficiencyKmPerLiter - actualEfficiency) / vc.fuelEfficiencyKmPerLiter) * 100)
        });
      }
    }
  }
  
  return anomalies.sort((a, b) => b.deviationPercent - a.deviationPercent);
};

export const getFinancialBrief = async () => {
  const vehicleCosts = await getVehicleCostReport();
  
  const topCostVehicles = [...vehicleCosts]
    .sort((left, right) => right.totalOperationalCost - left.totalOperationalCost)
    .slice(0, 3);
    
  const anomalies = await getFuelAnomalies();
  const fuelAnomaliesCount = anomalies.length;
  
  const budgets = await prisma.vehicleBudget.findMany();
  let overBudgetVehiclesCount = 0;
  
  for (const b of budgets) {
    const vc = vehicleCosts.find(v => v.vehicleId === b.vehicleId);
    if (vc && vc.totalOperationalCost > Number(b.monthlyBudget)) {
      overBudgetVehiclesCount++;
    }
  }
  
  return { topCostVehicles, fuelAnomaliesCount, overBudgetVehiclesCount };
};

export const getBudgetStatus = async () => {
  const vehicleCosts = await getVehicleCostReport();
  const budgets = await prisma.vehicleBudget.findMany();
  
  const currentDay = new Date().getDate() || 1;
  const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
  
  return budgets.map(b => {
    const vc = vehicleCosts.find(v => v.vehicleId === b.vehicleId);
    const spentMTD = vc ? vc.totalOperationalCost : 0;
    const projectedMonthEnd = (spentMTD / currentDay) * daysInMonth;
    
    return {
      vehicleId: b.vehicleId,
      regNumber: vc ? vc.regNumber : 'Unknown',
      monthlyBudget: Number(b.monthlyBudget),
      spentMTD,
      projectedMonthEnd: round(projectedMonthEnd)
    };
  }).sort((a, b) => b.spentMTD - a.spentMTD);
};

export const getTripEfficiencyRankings = async () => {
  return await getFuelAnomalies();
};

import fsSync from 'fs';

export const saveSnapshot = async () => {
  const report = await getVehicleCostReportCsv();
  const snapshotsDir = path.join(process.cwd(), 'uploads', 'snapshots');
  if (!fsSync.existsSync(snapshotsDir)) {
    fsSync.mkdirSync(snapshotsDir, { recursive: true });
  }
  const filename = `snapshot-${Date.now()}.csv`;
  fsSync.writeFileSync(path.join(snapshotsDir, filename), report);
  return { filename };
};

export const getSnapshots = async () => {
  const snapshotsDir = path.join(process.cwd(), 'uploads', 'snapshots');
  if (!fsSync.existsSync(snapshotsDir)) return [];
  return fsSync.readdirSync(snapshotsDir).filter(f => f.endsWith('.csv')).map(f => ({
    id: f,
    name: f,
    createdAt: new Date(parseInt(f.split('-')[1])).toISOString()
  })).sort((a, b) => b.id.localeCompare(a.id));
};
