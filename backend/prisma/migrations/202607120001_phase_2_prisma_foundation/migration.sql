-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('fleet_manager', 'driver', 'safety_officer', 'financial_analyst');

-- CreateEnum
CREATE TYPE "VehicleStatus" AS ENUM ('Available', 'On_Trip', 'In_Shop', 'Retired');

-- CreateEnum
CREATE TYPE "DriverStatus" AS ENUM ('Available', 'On_Trip', 'Off_Duty', 'Suspended');

-- CreateEnum
CREATE TYPE "TripStatus" AS ENUM ('Draft', 'Dispatched', 'Completed', 'Cancelled');

-- CreateEnum
CREATE TYPE "MaintenanceStatus" AS ENUM ('Open', 'Closed');

-- CreateEnum
CREATE TYPE "ExpenseCategory" AS ENUM ('toll', 'fine', 'other');

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vehicle" (
    "id" SERIAL NOT NULL,
    "regNumber" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "maxLoadCapacityKg" DECIMAL(12,2) NOT NULL,
    "odometerKm" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "acquisitionCost" DECIMAL(12,2) NOT NULL,
    "status" "VehicleStatus" NOT NULL DEFAULT 'Available',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Vehicle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Driver" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "licenseNumber" TEXT NOT NULL,
    "licenseCategory" TEXT NOT NULL,
    "licenseExpiryDate" TIMESTAMP(3) NOT NULL,
    "contactNumber" TEXT NOT NULL,
    "safetyScore" INTEGER NOT NULL DEFAULT 100,
    "status" "DriverStatus" NOT NULL DEFAULT 'Available',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Driver_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Trip" (
    "id" SERIAL NOT NULL,
    "source" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "vehicleId" INTEGER NOT NULL,
    "driverId" INTEGER NOT NULL,
    "cargoWeightKg" DECIMAL(12,2) NOT NULL,
    "plannedDistanceKm" DECIMAL(12,2) NOT NULL,
    "finalOdometerKm" DECIMAL(12,2),
    "fuelConsumedLiters" DECIMAL(12,2),
    "status" "TripStatus" NOT NULL DEFAULT 'Draft',
    "createdById" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Trip_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaintenanceLog" (
    "id" SERIAL NOT NULL,
    "vehicleId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "cost" DECIMAL(12,2) NOT NULL,
    "status" "MaintenanceStatus" NOT NULL DEFAULT 'Open',
    "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" TIMESTAMP(3),

    CONSTRAINT "MaintenanceLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FuelLog" (
    "id" SERIAL NOT NULL,
    "vehicleId" INTEGER NOT NULL,
    "tripId" INTEGER,
    "liters" DECIMAL(12,2) NOT NULL,
    "cost" DECIMAL(12,2) NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FuelLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Expense" (
    "id" SERIAL NOT NULL,
    "vehicleId" INTEGER NOT NULL,
    "category" "ExpenseCategory" NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "note" TEXT,

    CONSTRAINT "Expense_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Vehicle_regNumber_key" ON "Vehicle"("regNumber");

-- CreateIndex
CREATE INDEX "Vehicle_status_idx" ON "Vehicle"("status");

-- CreateIndex
CREATE INDEX "Vehicle_type_idx" ON "Vehicle"("type");

-- CreateIndex
CREATE UNIQUE INDEX "Driver_licenseNumber_key" ON "Driver"("licenseNumber");

-- CreateIndex
CREATE INDEX "Driver_status_idx" ON "Driver"("status");

-- CreateIndex
CREATE INDEX "Driver_licenseExpiryDate_idx" ON "Driver"("licenseExpiryDate");

-- CreateIndex
CREATE INDEX "Trip_status_idx" ON "Trip"("status");

-- CreateIndex
CREATE INDEX "Trip_vehicleId_idx" ON "Trip"("vehicleId");

-- CreateIndex
CREATE INDEX "Trip_driverId_idx" ON "Trip"("driverId");

-- CreateIndex
CREATE INDEX "MaintenanceLog_vehicleId_status_idx" ON "MaintenanceLog"("vehicleId", "status");

-- CreateIndex
CREATE INDEX "FuelLog_vehicleId_date_idx" ON "FuelLog"("vehicleId", "date");

-- AddForeignKey
ALTER TABLE "Trip" ADD CONSTRAINT "Trip_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trip" ADD CONSTRAINT "Trip_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trip" ADD CONSTRAINT "Trip_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceLog" ADD CONSTRAINT "MaintenanceLog_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FuelLog" ADD CONSTRAINT "FuelLog_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FuelLog" ADD CONSTRAINT "FuelLog_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Database-level guardrails required by the updated build plan.
ALTER TABLE "Vehicle"
  ADD CONSTRAINT "Vehicle_maxLoadCapacityKg_positive" CHECK ("maxLoadCapacityKg" > 0),
  ADD CONSTRAINT "Vehicle_odometerKm_nonnegative" CHECK ("odometerKm" >= 0),
  ADD CONSTRAINT "Vehicle_acquisitionCost_nonnegative" CHECK ("acquisitionCost" >= 0);

ALTER TABLE "Driver"
  ADD CONSTRAINT "Driver_safetyScore_range" CHECK ("safetyScore" >= 0 AND "safetyScore" <= 100);

ALTER TABLE "Trip"
  ADD CONSTRAINT "Trip_cargoWeightKg_positive" CHECK ("cargoWeightKg" > 0),
  ADD CONSTRAINT "Trip_plannedDistanceKm_nonnegative" CHECK ("plannedDistanceKm" >= 0);

ALTER TABLE "MaintenanceLog"
  ADD CONSTRAINT "MaintenanceLog_cost_nonnegative" CHECK ("cost" >= 0);

ALTER TABLE "FuelLog"
  ADD CONSTRAINT "FuelLog_liters_nonnegative" CHECK ("liters" >= 0),
  ADD CONSTRAINT "FuelLog_cost_nonnegative" CHECK ("cost" >= 0);

ALTER TABLE "Expense"
  ADD CONSTRAINT "Expense_amount_nonnegative" CHECK ("amount" >= 0);

