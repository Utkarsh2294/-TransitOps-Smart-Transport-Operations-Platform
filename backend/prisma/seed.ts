import { prisma } from "../src/config/prisma.js";

const seed = async () => {
  const vehicles = [
    ["KA01AB1234", "City Freight 01", "Truck", "12000", "25000", "3800000", "Available"],
    ["KA02CD4321", "North Line Cargo", "Truck", "16000", "41000", "4650000", "Available"],
    ["MH12TR9087", "Western Express", "Container", "22000", "78000", "7200000", "On_Trip"],
    ["DL01LM7788", "Capital Shuttle", "Van", "3500", "18000", "1250000", "Available"],
    ["TN09ZX2211", "Coastal Hauler", "Truck", "14000", "52000", "4200000", "In_Shop"],
    ["GJ05PL5512", "Port Connector", "Trailer", "28000", "89000", "8200000", "Available"],
    ["RJ14QW9081", "Desert Carrier", "Truck", "10000", "33500", "3150000", "Retired"],
    ["TS07UV4409", "Metro Supply Van", "Van", "2800", "12000", "980000", "Available"],
    ["AP31MN6204", "Eastern Cold Chain", "Reefer", "9000", "46000", "5400000", "Available"],
    ["UP16GH3345", "Express Parcel 16", "Van", "3200", "22000", "1180000", "On_Trip"],
    ["KL07FR7820", "Green Corridor", "Truck", "13000", "39000", "3950000", "Available"],
    ["WB20TY6719", "Riverfront Logistics", "Truck", "15000", "61000", "4450000", "In_Shop"],
    ["HR26BT9088", "Gurgaon Rapid", "Van", "3000", "17500", "1100000", "Available"],
    ["MP09CV4512", "Central Bulk Mover", "Trailer", "26000", "94000", "7900000", "Available"],
    ["PB10DS0198", "Punjab Agro Carrier", "Truck", "11000", "28000", "3400000", "Available"],
  ] as const;

  const drivers = [
    ["Aarav Mehta", "DL-KA-2026-001", "HMV", "2027-12-31", "+91 98765 43210", 94, "Available"],
    ["Ishaan Rao", "DL-KA-2026-002", "HMV", "2026-08-03", "+91 98765 43211", 88, "Available"],
    ["Kabir Singh", "DL-MH-2026-003", "Trailer", "2028-02-14", "+91 98765 43212", 91, "On_Trip"],
    ["Rohan Das", "DL-DL-2026-004", "LMV", "2027-04-22", "+91 98765 43213", 84, "Available"],
    ["Dev Patel", "DL-GJ-2026-005", "HMV", "2025-12-10", "+91 98765 43214", 72, "Suspended"],
    ["Nikhil Jain", "DL-RJ-2026-006", "HMV", "2026-07-25", "+91 98765 43215", 68, "Available"],
    ["Arjun Nair", "DL-KL-2026-007", "HMV", "2024-06-30", "+91 98765 43216", 77, "Available"],
    ["Vihaan Shah", "DL-TS-2026-008", "LMV", "2027-09-19", "+91 98765 43217", 96, "Available"],
    ["Aditya Menon", "DL-AP-2026-009", "Reefer", "2028-01-08", "+91 98765 43218", 89, "Off_Duty"],
    ["Yash Verma", "DL-UP-2026-010", "LMV", "2026-08-11", "+91 98765 43219", 81, "Available"],
    ["Kunal Batra", "DL-HR-2026-011", "HMV", "2027-05-05", "+91 98765 43220", 92, "Available"],
    ["Manav Kapoor", "DL-WB-2026-012", "HMV", "2026-07-20", "+91 98765 43221", 63, "Suspended"],
    ["Samar Iyer", "DL-MP-2026-013", "Trailer", "2028-10-02", "+91 98765 43222", 86, "Available"],
    ["Reyansh Gill", "DL-PB-2026-014", "HMV", "2026-07-28", "+91 98765 43223", 79, "Available"],
    ["Atharv Joshi", "DL-TN-2026-015", "HMV", "2023-11-15", "+91 98765 43224", 70, "Available"],
  ] as const;

  await prisma.$transaction(async (tx) => {
    for (const vehicle of vehicles) {
      const [regNumber, name, type, maxLoadCapacityKg, odometerKm, acquisitionCost, status] = vehicle;
      await tx.vehicle.upsert({
        where: { regNumber },
        update: { name, type, maxLoadCapacityKg, odometerKm, acquisitionCost, status, serviceIntervalKm: 10000, lastServiceOdometerKm: String(Math.max(0, Number(odometerKm) - 8200)) },
        create: { regNumber, name, type, maxLoadCapacityKg, odometerKm, acquisitionCost, status, serviceIntervalKm: 10000, lastServiceOdometerKm: String(Math.max(0, Number(odometerKm) - 8200)) },
      });
    }

    for (const driver of drivers) {
      const [name, licenseNumber, licenseCategory, licenseExpiryDate, contactNumber, safetyScore, status] =
        driver;
      await tx.driver.upsert({
        where: { licenseNumber },
        update: {
          name,
          licenseCategory,
          licenseExpiryDate: new Date(licenseExpiryDate),
          contactNumber,
          safetyScore,
          status,
        },
        create: {
          name,
          licenseNumber,
          licenseCategory,
          licenseExpiryDate: new Date(licenseExpiryDate),
          contactNumber,
          safetyScore,
          status,
        },
      });
    }

    const seededVehicles = await tx.vehicle.findMany({ take: 4, orderBy: { id: "asc" } });
    for (const [index, vehicle] of seededVehicles.entries()) {
      await tx.vehicleDocument.deleteMany({ where: { vehicleId: vehicle.id } });
      await tx.vehicleDocument.createMany({ data: [
        { vehicleId: vehicle.id, docType: "RC", fileName: "registration-certificate.pdf", fileUrl: "/uploads/demo-registration-certificate.pdf", expiryDate: new Date(index === 0 ? "2026-07-20" : "2027-01-15") },
        { vehicleId: vehicle.id, docType: "Insurance", fileName: "insurance-policy.pdf", fileUrl: "/uploads/demo-insurance-policy.pdf", expiryDate: new Date(index === 1 ? "2026-06-25" : "2026-09-30") },
        { vehicleId: vehicle.id, docType: "PUC", fileName: "puc-certificate.pdf", fileUrl: "/uploads/demo-puc-certificate.pdf", expiryDate: new Date("2026-12-30") },
      ] });
    }

    const seededDrivers = await tx.driver.findMany({ select: { id: true, safetyScore: true } });
    for (const driver of seededDrivers) {
      await tx.safetyScoreEvent.deleteMany({ where: { driverId: driver.id } });
      await tx.safetyScoreEvent.createMany({ data: [5, 4, 3, 2, 1].map((weeksAgo, index) => ({
        driverId: driver.id,
        score: Math.max(50, driver.safetyScore - 5 + index),
        reason: index === 4 ? "Current safety review" : "Routine safety review",
        recordedAt: new Date(Date.now() - weeksAgo * 7 * 24 * 60 * 60 * 1000),
      })) });
    }
  });

  console.log(`Seeded ${vehicles.length} vehicles and ${drivers.length} drivers.`);
};

seed()
  .finally(async () => {
    await prisma.$disconnect();
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
