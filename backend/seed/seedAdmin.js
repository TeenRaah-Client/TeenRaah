// Run once with: npm run seed:admin
// Creates the admin account from ADMIN_EMAIL / ADMIN_PASSWORD in .env.
// This is intentionally NOT reachable through any public API route —
// it's the only way an "admin" role user gets created.
import dotenv from "dotenv";
import mongoose from "mongoose";
import User from "../models/User.js";
import { generateReferralCode } from "../utils/generateCodes.js";

dotenv.config();

const run = async () => {
  if (!process.env.MONGO_URI || process.env.MONGO_URI.includes("your_mongodb")) {
    console.error("❌ Set a real MONGO_URI in backend/.env before seeding.");
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);

  const email = (process.env.ADMIN_EMAIL || "admin@teenraah.com").toLowerCase();
  const password = process.env.ADMIN_PASSWORD;

  if (!password || password === "change_this_before_seeding") {
    console.error("❌ Set a real ADMIN_PASSWORD in backend/.env before seeding.");
    process.exit(1);
  }

  const existing = await User.findOne({ email });
  if (existing) {
    console.log(`ℹ️  Admin already exists for ${email}. No changes made.`);
    process.exit(0);
  }

  const referralCode = await generateReferralCode("ADMIN");

  await User.create({
    name: "TeenRaah Admin",
    email,
    password,
    role: "admin",
    isVerified: true,
    referralCode,
  });

  console.log(`✅ Admin account created for ${email}`);
  console.log(`   Log in from the hidden admin route with this email/password.`);
  process.exit(0);
};

run().catch((err) => {
  console.error("❌ Seeding failed:", err.message);
  process.exit(1);
});
