CREATE TYPE "DocType" AS ENUM ('RC', 'Insurance', 'PUC', 'Permit', 'Other');

ALTER TABLE "Vehicle"
  ADD COLUMN "serviceIntervalKm" INTEGER,
  ADD COLUMN "lastServiceOdometerKm" DECIMAL(12,2);

CREATE TABLE "VehicleDocument" (
  "id" SERIAL NOT NULL,
  "vehicleId" INTEGER NOT NULL,
  "docType" "DocType" NOT NULL,
  "fileUrl" TEXT NOT NULL,
  "fileName" TEXT NOT NULL,
  "expiryDate" TIMESTAMP(3),
  "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "VehicleDocument_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SafetyScoreEvent" (
  "id" SERIAL NOT NULL,
  "driverId" INTEGER NOT NULL,
  "score" INTEGER NOT NULL,
  "reason" TEXT,
  "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SafetyScoreEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "VehicleDocument_vehicleId_idx" ON "VehicleDocument"("vehicleId");
CREATE INDEX "VehicleDocument_expiryDate_idx" ON "VehicleDocument"("expiryDate");
CREATE INDEX "SafetyScoreEvent_driverId_recordedAt_idx" ON "SafetyScoreEvent"("driverId", "recordedAt");

ALTER TABLE "VehicleDocument" ADD CONSTRAINT "VehicleDocument_vehicleId_fkey"
  FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SafetyScoreEvent" ADD CONSTRAINT "SafetyScoreEvent_driverId_fkey"
  FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE CASCADE ON UPDATE CASCADE;
