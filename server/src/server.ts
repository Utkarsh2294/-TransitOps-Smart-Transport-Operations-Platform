import "dotenv/config";
import { createApp } from "./app.js";
import { connectDatabase } from "./db.js";

const port = Number(process.env.PORT ?? 4000);

await connectDatabase();

createApp().listen(port, () => {
  console.log(`TransitOps API listening on port ${port}`);
});

