import mongoose from "mongoose";
import { connectDB, Tenant } from "../src/server/db";

async function check() {
  await connectDB();
  const tenants = await Tenant.find({});
  console.log("TENANTS_IN_DB:");
  tenants.forEach(t => {
    console.log(`- ${t.name} (${t.slug}): Departments: ${JSON.stringify(t.departments)}`);
  });
  process.exit(0);
}

check();
