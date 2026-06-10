import "dotenv/config";
import bcrypt from "bcryptjs";
import { connectDB, User } from "./src/server/db.js";

async function run() {
  await connectDB();
  const email = "jis@gmail.com";
  const password = "SecurePassword123!";
  
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);
  
  const result = await User.updateOne({ email }, { $set: { password: hashedPassword } });
  
  if (result.matchedCount > 0) {
    console.log(`SUCCESS: Password for ${email} updated to ${password}`);
  } else {
    console.log(`ERROR: User ${email} not found.`);
  }
  
  process.exit(0);
}

run();
