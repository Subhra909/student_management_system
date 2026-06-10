import mongoose from "mongoose";
import { connectDB, Tenant } from "../src/server/db";

async function migrate() {
  await connectDB();
  console.log("[SYS] Starting Migration: Adding departments field to all tenants...");
  
  const result = await Tenant.updateMany(
    { departments: { $exists: false } },
    { $set: { departments: [] } }
  );

  console.log(`[SYS] Migration Complete. Matched: ${result.matchedCount}, Modified: ${result.modifiedCount}`);
  process.exit(0);
}

migrate().catch(err => {
  console.error("[ERROR] Migration failed:", err);
  process.exit(1);
});
