import mongoose from "mongoose";
import User from "../models/User";
import bcrypt from "bcryptjs";
import { connectMongo } from "../utils/db";
import { config } from "dotenv";

config();

async function createAdmin() {
  await connectMongo();
  
  const email = "admin@petconnect.com";
  const password = "admin@petconnect.com";
  
  try {
    const existingAdmin = await User.findOne({ email });
    if (existingAdmin) {
      console.log("Admin user already exists. Updating password and role...");
      existingAdmin.password = password;
      existingAdmin.role = "admin";
      existingAdmin.isAdmin = true;
      existingAdmin.isEmailVerified = true;
      await existingAdmin.save();
      console.log("Admin user updated successfully.");
    } else {
      const admin = new User({
        email,
        password,
        role: "admin",
        firstName: "System",
        lastName: "Admin",
        isAdmin: true,
        isEmailVerified: true
      });
      await admin.save();
      console.log("Admin user created successfully.");
    }
  } catch (error) {
    console.error("Error creating/updating admin:", error);
  } finally {
    await mongoose.connection.close();
  }
}

createAdmin();
