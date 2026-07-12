import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { prisma } from "./config/prisma.js";

const startServer = async () => {
  await prisma.$connect();

  const app = createApp();
  app.listen(env.PORT, () => {
    console.log(`TransitOps API listening on http://localhost:${env.PORT}`);
  });
};

startServer().catch((error) => {
  console.error("Failed to start TransitOps API", error);
  process.exit(1);
});
