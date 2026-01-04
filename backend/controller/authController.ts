import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import User from "../models/User";
import Doctor from "../models/Doctor";
import bcrypt from "bcryptjs";

function signToken(user: any) {
	const secret = process.env.JWT_SECRET || "dev_secret";
	return jwt.sign(
		{ sub: user._id.toString(), role: user.role },
		secret,
		{ expiresIn: "7d" }
	);
}

function publicUser(user: any) {
	const { password, __v, resetToken, resetTokenExpiry, emailVerificationToken, verificationCode, ...rest } = user.toObject ? user.toObject() : user;
	return rest;
}

export async function signup(req: Request, res: Response) {
	try {
		const { email, password, role = "pet_owner", firstName, lastName } = req.body as { email: string; password: string; role?: string; firstName?: string; lastName?: string };
		
		if (!email || !password) {
			return res.status(400).json({ message: "email and password are required" });
		}
		
		// Only allow these roles to be selected by users
		const allowedRoles = ["pet_owner", "veterinarian", "shelter", "pharmacy"];
		if (!allowedRoles.includes(role)) {
			return res.status(400).json({ message: "invalid role. Allowed roles: pet_owner, veterinarian, shelter, pharmacy" });
		}

		// Check if MongoDB is connected
		if (mongoose.connection.readyState !== 1) {
			return res.status(503).json({ message: "Database not connected. Please try again later." });
		}

		const exists = await User.findOne({ email });
		if (exists) {
			return res.status(409).json({ message: "email already in use" });
		}

		// Create user object, only include firstName/lastName if they have values
		const userData: any = {
			email: email.trim().toLowerCase(),
			password,
			role,
			isDoctor: role === "veterinarian",
			isAdmin: false
		};

		if (firstName && firstName.trim()) {
			userData.firstName = firstName.trim();
		}
		if (lastName && lastName.trim()) {
			userData.lastName = lastName.trim();
		}

		const user = await User.create(userData);

		// If veterinarian, create Doctor profile
		if (role === "veterinarian") {
			try {
				await Doctor.create({
					firstName: firstName || "Veterinarian",
					lastName: lastName || "",
					email: user.email,
					password: password, // Will be hashed by Doctor schema pre-save hook
					specialization: "General Practice", // Default, can be updated in settings
					experience: 0,
					bio: "",
					availability: [],
					appointmentDuration: 30,
					bookingFee: 500,
				});
			} catch (doctorError: any) {
				// If doctor creation fails, log but don't fail user creation
				console.error("Failed to create doctor profile:", doctorError);
			}
		}

		const token = signToken(user);
		return res.status(201).json({ user: publicUser(user), token });
	} catch (error: any) {
		console.error("Signup error:", error);
		// Return more specific error messages
		if (error.name === "ValidationError") {
			const messages = Object.values(error.errors).map((err: any) => err.message).join(", ");
			return res.status(400).json({ message: `Validation error: ${messages}`, details: error.errors });
		}
		if (error.code === 11000) {
			return res.status(409).json({ message: "email already in use" });
		}
		return res.status(500).json({ 
			message: error.message || "failed to create user",
			error: process.env.NODE_ENV === "development" ? error.stack : undefined
		});
	}
}

export async function login(req: Request, res: Response) {
	try {
		const { email, password } = req.body as { email: string; password: string };
		if (!email || !password) return res.status(400).json({ message: "email and password are required" });

		const user = await User.findOne({ email }).select("+password");
		if (!user) return res.status(401).json({ message: "invalid credentials" });

		const ok = await bcrypt.compare(password, user.password);
		if (!ok) return res.status(401).json({ message: "invalid credentials" });

		const token = signToken(user);
		return res.json({ user: publicUser(user), token });
	} catch (_error) {
		return res.status(500).json({ message: "failed to login" });
	}
}


