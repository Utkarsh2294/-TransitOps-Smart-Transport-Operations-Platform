import { TripStatus, VehicleStatus } from "@prisma/client";

import { prisma } from "../config/prisma.js";

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
