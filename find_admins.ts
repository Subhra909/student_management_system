import "dotenv/config";
import { connectDB, User } from "./src/server/db.js";

async function run() {
  await connectDB();
  const admins = await User.find({ role: "admin" }).select("email name tenantId");
  console.log("ADMINS:", JSON.stringify(admins, null, 2));
  process.exit(0);
}

run();
