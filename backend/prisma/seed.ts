import bcrypt from "bcryptjs";

import { prisma } from "../src/config/prisma.js";

const seed = async () => {
  const demoPasswordHash = await bcrypt.hash("TransitOps2026!", 12);

  // ── Demo users (all 4 roles) ──────────────────────────────────────
  const users = [
    { name: "Priya Sharma", email: "admin@transitops.in", role: "fleet_manager" as const },
    { name: "Aarav Mehta", email: "driver@transitops.in", role: "driver" as const },
    { name: "Neha Kapoor", email: "safety@transitops.in", role: "safety_officer" as const },
    { name: "Ravi Kumar", email: "finance@transitops.in", role: "financial_analyst" as const },
  ];
  const seededUsers: { id: number; role: string }[] = [];
  for (const user of users) {
    const seeded = await prisma.user.upsert({
      where: { email: user.email },
      update: { name: user.name, passwordHash: demoPasswordHash, role: user.role },
      create: { name: user.name, email: user.email, passwordHash: demoPasswordHash, role: user.role },
    });
    seededUsers.push({ id: seeded.id, role: seeded.role });
  }
  const fleetManagerId = seededUsers.find((u) => u.role === "fleet_manager")!.id;
  console.log("Seeded 4 demo users (password: TransitOps2026!)");

  // ── Vehicles ──────────────────────────────────────────────────────
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

  // ── Drivers ───────────────────────────────────────────────────────
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
    // ── Upsert vehicles ───────────────────────────────────────────
    for (const vehicle of vehicles) {
      const [regNumber, name, type, maxLoadCapacityKg, odometerKm, acquisitionCost, status] = vehicle;
      await tx.vehicle.upsert({
        where: { regNumber },
        update: { name, type, maxLoadCapacityKg, odometerKm, acquisitionCost, status, serviceIntervalKm: 10000, lastServiceOdometerKm: String(Math.max(0, Number(odometerKm) - 8200)) },
        create: { regNumber, name, type, maxLoadCapacityKg, odometerKm, acquisitionCost, status, serviceIntervalKm: 10000, lastServiceOdometerKm: String(Math.max(0, Number(odometerKm) - 8200)) },
      });
    }

    // ── Upsert drivers ────────────────────────────────────────────
    for (const driver of drivers) {
      const [name, licenseNumber, licenseCategory, licenseExpiryDate, contactNumber, safetyScore, status] = driver;
      await tx.driver.upsert({
        where: { licenseNumber },
        update: { name, licenseCategory, licenseExpiryDate: new Date(licenseExpiryDate), contactNumber, safetyScore, status },
        create: { name, licenseNumber, licenseCategory, licenseExpiryDate: new Date(licenseExpiryDate), contactNumber, safetyScore, status },
      });
    }

    // ── Seed vehicle documents ────────────────────────────────────
    const seededVehicles = await tx.vehicle.findMany({ take: 4, orderBy: { id: "asc" } });
    for (const [index, vehicle] of seededVehicles.entries()) {
      await tx.vehicleDocument.deleteMany({ where: { vehicleId: vehicle.id } });
      await tx.vehicleDocument.createMany({ data: [
        { vehicleId: vehicle.id, docType: "RC", fileName: "registration-certificate.pdf", fileUrl: "/uploads/demo-registration-certificate.pdf", expiryDate: new Date(index === 0 ? "2026-07-20" : "2027-01-15") },
        { vehicleId: vehicle.id, docType: "Insurance", fileName: "insurance-policy.pdf", fileUrl: "/uploads/demo-insurance-policy.pdf", expiryDate: new Date(index === 1 ? "2026-06-25" : "2026-09-30") },
        { vehicleId: vehicle.id, docType: "PUC", fileName: "puc-certificate.pdf", fileUrl: "/uploads/demo-puc-certificate.pdf", expiryDate: new Date("2026-12-30") },
      ] });
    }

    // ── Seed safety score events ──────────────────────────────────
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

    // ── Seed trips (12 across all statuses) ───────────────────────
    const allVehicles = await tx.vehicle.findMany({ orderBy: { id: "asc" } });
    const allDrivers = await tx.driver.findMany({ orderBy: { id: "asc" } });
    await tx.trip.deleteMany({});

    const tripData = [
      // 4 Completed trips
      { source: "Mumbai", destination: "Pune", vIdx: 0, dIdx: 0, cargo: 8000, dist: 150, status: "Completed", finalOdo: 25150, fuel: 22 },
      { source: "Delhi", destination: "Jaipur", vIdx: 3, dIdx: 3, cargo: 2800, dist: 280, status: "Completed", finalOdo: 18280, fuel: 35 },
      { source: "Chennai", destination: "Bangalore", vIdx: 7, dIdx: 7, cargo: 2200, dist: 350, status: "Completed", finalOdo: 12350, fuel: 42 },
      { source: "Ahmedabad", destination: "Surat", vIdx: 5, dIdx: 5, cargo: 18000, dist: 260, status: "Completed", finalOdo: 89260, fuel: 95 }, // Fuel-inefficient trip (260km / 95L = 2.7km/L, usually higher)
      // 3 Dispatched trips (vehicle/driver On_Trip)
      { source: "Mumbai", destination: "Nagpur", vIdx: 2, dIdx: 2, cargo: 15000, dist: 800, status: "Dispatched" },
      { source: "Lucknow", destination: "Varanasi", vIdx: 9, dIdx: 9, cargo: 2500, dist: 320, status: "Dispatched" },
      // 3 Draft trips
      { source: "Kolkata", destination: "Patna", vIdx: 10, dIdx: 10, cargo: 9000, dist: 590, status: "Draft" },
      { source: "Chandigarh", destination: "Amritsar", vIdx: 14, dIdx: 13, cargo: 7500, dist: 230, status: "Draft" },
      { source: "Hyderabad", destination: "Vizag", vIdx: 8, dIdx: 8, cargo: 6000, dist: 620, status: "Draft" },
      // 2 Cancelled trips
      { source: "Guwahati", destination: "Shillong", vIdx: 13, dIdx: 12, cargo: 20000, dist: 100, status: "Cancelled" },
      { source: "Bhopal", destination: "Indore", vIdx: 12, dIdx: 11, cargo: 2000, dist: 195, status: "Cancelled" },
      // 1 more completed for driver role
      { source: "Kochi", destination: "Trivandrum", vIdx: 10, dIdx: 0, cargo: 10000, dist: 200, status: "Completed", finalOdo: 39200, fuel: 28 },
    ];

    for (const trip of tripData) {
      const v = allVehicles[trip.vIdx];
      const d = allDrivers[trip.dIdx];
      if (!v || !d) continue;
      await tx.trip.create({
        data: {
          source: trip.source,
          destination: trip.destination,
          vehicleId: v.id,
          driverId: d.id,
          cargoWeightKg: trip.cargo,
          plannedDistanceKm: trip.dist,
          status: trip.status as "Draft" | "Dispatched" | "Completed" | "Cancelled",
          createdById: fleetManagerId,
          finalOdometerKm: trip.finalOdo ?? null,
          fuelConsumedLiters: trip.fuel ?? null,
        },
      });
    }
    console.log(`Seeded ${tripData.length} trips.`);

    // ── Seed fuel logs ────────────────────────────────────────────
    await tx.fuelLog.deleteMany({});
    const fuelData = [
      { vIdx: 0, liters: 55, cost: 5775, daysAgo: 10 },
      { vIdx: 0, liters: 48, cost: 5040, daysAgo: 3 },
      { vIdx: 2, liters: 120, cost: 12600, daysAgo: 7 },
      { vIdx: 3, liters: 35, cost: 3675, daysAgo: 5 },
      { vIdx: 5, liters: 95, cost: 9975, daysAgo: 14 },
      { vIdx: 7, liters: 28, cost: 2940, daysAgo: 2 },
      { vIdx: 9, liters: 42, cost: 4410, daysAgo: 8 },
      { vIdx: 10, liters: 65, cost: 6825, daysAgo: 12 },
      { vIdx: 14, liters: 50, cost: 5250, daysAgo: 6 },
      { vIdx: 8, liters: 70, cost: 7350, daysAgo: 4 },
    ];
    for (const fuel of fuelData) {
      const v = allVehicles[fuel.vIdx];
      if (!v) continue;
      await tx.fuelLog.create({
        data: {
          vehicleId: v.id,
          liters: fuel.liters,
          cost: fuel.cost,
          date: new Date(Date.now() - fuel.daysAgo * 24 * 60 * 60 * 1000),
        },
      });
    }
    console.log(`Seeded ${fuelData.length} fuel logs.`);

    // ── Seed expenses ─────────────────────────────────────────────
    await tx.expense.deleteMany({});
    const expenseData = [
      { vIdx: 0, category: "toll" as const, amount: 1200, note: "Mumbai-Pune expressway toll", daysAgo: 10 },
      { vIdx: 2, category: "toll" as const, amount: 3500, note: "Mumbai-Nagpur highway tolls", daysAgo: 7 },
      { vIdx: 3, category: "fine" as const, amount: 2000, note: "Overweight penalty", daysAgo: 20 },
      { vIdx: 5, category: "toll" as const, amount: 1800, note: "Ahmedabad-Surat toll", daysAgo: 14 },
      { vIdx: 9, category: "other" as const, amount: 800, note: "Parking charges", daysAgo: 3 },
      { vIdx: 10, category: "toll" as const, amount: 950, note: "Kochi bypass toll", daysAgo: 12 },
      { vIdx: 14, category: "fine" as const, amount: 1500, note: "Speed violation fine", daysAgo: 18 },
      { vIdx: 7, category: "other" as const, amount: 450, note: "Vehicle cleaning", daysAgo: 1 },
    ];
    for (const exp of expenseData) {
      const v = allVehicles[exp.vIdx];
      if (!v) continue;
      await tx.expense.create({
        data: {
          vehicleId: v.id,
          category: exp.category,
          amount: exp.amount,
          note: exp.note,
          date: new Date(Date.now() - exp.daysAgo * 24 * 60 * 60 * 1000),
        },
      });
    }
    console.log(`Seeded ${expenseData.length} expenses.`);

    // ── Seed maintenance logs ─────────────────────────────────────
    await tx.maintenanceLog.deleteMany({});
    const maintenanceData = [
      { vIdx: 4, type: "Engine overhaul", cost: 45000, status: "Open" as const, daysAgo: 5 },
      { vIdx: 11, type: "Brake pad replacement", cost: 12000, status: "Open" as const, daysAgo: 3 },
      { vIdx: 0, type: "Oil change", cost: 3500, status: "Closed" as const, daysAgo: 30, closedDaysAgo: 28 },
      { vIdx: 3, type: "Tyre replacement", cost: 24000, status: "Closed" as const, daysAgo: 45, closedDaysAgo: 42 },
      { vIdx: 5, type: "AC repair", cost: 8500, status: "Closed" as const, daysAgo: 20, closedDaysAgo: 17 },
      { vIdx: 10, type: "Suspension repair", cost: 15000, status: "Closed" as const, daysAgo: 60, closedDaysAgo: 55 },
    ];
    for (const maint of maintenanceData) {
      const v = allVehicles[maint.vIdx];
      if (!v) continue;
      await tx.maintenanceLog.create({
        data: {
          vehicleId: v.id,
          type: maint.type,
          cost: maint.cost,
          status: maint.status,
          openedAt: new Date(Date.now() - maint.daysAgo * 24 * 60 * 60 * 1000),
          closedAt: maint.closedDaysAgo ? new Date(Date.now() - maint.closedDaysAgo * 24 * 60 * 60 * 1000) : null,
        },
      });
    }
    console.log(`Seeded ${maintenanceData.length} maintenance logs.`);
    // ── Seed vehicle budgets (One over-budget) ────────────────────
    await tx.vehicleBudget.deleteMany({});
    const budgetData = [
      { vIdx: 0, budget: 15000 },
      { vIdx: 2, budget: 20000 },
      { vIdx: 3, budget: 3000 }, // Deliberately low budget to force over-budget
      { vIdx: 5, budget: 25000 },
      { vIdx: 7, budget: 8000 },
      { vIdx: 10, budget: 12000 },
    ];
    for (const b of budgetData) {
      const v = allVehicles[b.vIdx];
      if (!v) continue;
      await tx.vehicleBudget.create({
        data: {
          vehicleId: v.id,
          monthlyBudget: b.budget,
        },
      });
    }
    console.log(`Seeded ${budgetData.length} vehicle budgets.`);

    // ── Seed recurring expenses ───────────────────────────────────
    await tx.recurringExpense.deleteMany({});
    const recurringData = [
      { vIdx: 0, category: "toll" as const, amount: 2500, frequency: "Monthly" as const, daysUntilDue: 15 },
      { vIdx: 3, category: "other" as const, amount: 1500, frequency: "Monthly" as const, daysUntilDue: -5 }, // Overdue
      { vIdx: 7, category: "toll" as const, amount: 3000, frequency: "Quarterly" as const, daysUntilDue: 45 },
    ];
    for (const r of recurringData) {
      const v = allVehicles[r.vIdx];
      if (!v) continue;
      await tx.recurringExpense.create({
        data: {
          vehicleId: v.id,
          category: r.category,
          amount: r.amount,
          frequency: r.frequency,
          nextDueDate: new Date(Date.now() + r.daysUntilDue * 24 * 60 * 60 * 1000),
          active: true,
        },
      });
    }
    console.log(`Seeded ${recurringData.length} recurring expenses.`);
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
