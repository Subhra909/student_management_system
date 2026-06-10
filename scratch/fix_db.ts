import mongoose from "mongoose";

const tenantSchema = new mongoose.Schema({
  tenantId: { type: String, required: true, unique: true },
  departments: { type: [String], default: [] }
}, { timestamps: true, strict: false });

const Tenant = mongoose.models.Tenant || mongoose.model("Tenant", tenantSchema);

async function migrate() {
  const MONGODB_URI = "mongodb+srv://subhrasanyal:password1234@student-manage.h6lncdp.mongodb.net/?appName=student-manage";
  console.log("[SYS] Connecting to MongoDB Atlas...");
  await mongoose.connect(MONGODB_URI);
  console.log("[SYS] Connected. Running update...");

  const result = await Tenant.updateMany(
    { departments: { $exists: false } },
    { $set: { departments: [] } }
  );

  console.log(`[SYS] Migration Result: Matched ${result.matchedCount}, Modified ${result.modifiedCount}`);
  process.exit(0);
}

migrate().catch(e => {
  console.error(e);
  process.exit(1);
});
