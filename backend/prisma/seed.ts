import { prisma } from "../src/config/prisma.js";

const seed = async () => {
  console.log("Seed script skeleton ready for Person A and Person B fixtures.");
};

seed()
  .finally(async () => {
    await prisma.$disconnect();
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
