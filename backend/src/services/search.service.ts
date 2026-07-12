import { prisma } from "../config/prisma.js";

export const searchTransitOps = async (query: string) => {
  const [vehicles, drivers] = await prisma.$transaction([
    prisma.vehicle.findMany({ where: { OR: [{ regNumber: { contains: query, mode: "insensitive" } }, { name: { contains: query, mode: "insensitive" } }] }, take: 8, select: { id: true, regNumber: true, name: true } }),
    prisma.driver.findMany({ where: { OR: [{ name: { contains: query, mode: "insensitive" } }, { licenseNumber: { contains: query, mode: "insensitive" } }] }, take: 8, select: { id: true, name: true, licenseNumber: true } }),
  ]);
  return [...vehicles.map((vehicle) => ({ type: "vehicle", id: vehicle.id, label: vehicle.regNumber, subtitle: vehicle.name })), ...drivers.map((driver) => ({ type: "driver", id: driver.id, label: driver.name, subtitle: driver.licenseNumber }))];
};
