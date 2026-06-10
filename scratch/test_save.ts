import mongoose from "mongoose";
import { connectDB, Tenant } from "../src/server/db";
import { v4 as uuidv4 } from "uuid";

async function test() {
  await connectDB();
  const tenantId = uuidv4();
  const slug = "test-" + Date.now();
  const tenant = new Tenant({
    tenantId,
    name: "Test College",
    slug,
    departments: ["Computer Science", "Mechanical"]
  });
  await tenant.save();
  console.log("SAVED_TENANT:");
  const saved = await Tenant.findOne({ tenantId });
  console.log(JSON.stringify(saved, null, 2));
  process.exit(0);
}

test();
