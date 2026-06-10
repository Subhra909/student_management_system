import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { User, connectDB } from "./src/server/db.js";

async function init() {
  try {
    console.log("EDUNEXUS_SYSTEM: Starting initialization...");
    await connectDB();
    
    const email = "admin@edunexus.global";
    const password = "SecurePassword123!";
    const name = "System Admin";

    const existing = await User.findOne({ role: "superadmin" });
    if (existing) {
      console.log("EDUNEXUS_SYSTEM: Super Admin already exists. Initialization aborted.");
      process.exit(0);
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    const superadmin = new User({
      uid: uuidv4(),
      tenantId: "SYSTEM",
      email,
      password: hashedPassword,
      name,
      role: "superadmin",
      collegeName: "EduNexus Global",
      currentSessionId: uuidv4(),
      lastLoginAt: new Date().toISOString()
    });

    await superadmin.save();
    console.log("EDUNEXUS_SYSTEM: Super Admin created successfully!");
    console.log("Email:", email);
    console.log("Password:", password);
    process.exit(0);
  } catch (error) {
    console.error("EDUNEXUS_SYSTEM_ERROR:", error);
    process.exit(1);
  }
}

init();
