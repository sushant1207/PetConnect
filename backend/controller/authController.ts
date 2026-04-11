import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import User from "../models/User";
import Doctor from "../models/Doctor";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { sendEmail } from "../utils/mailer";

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

		if (firstName && firstName.trim()) userData.firstName = firstName.trim();
		if (lastName && lastName.trim()) userData.lastName = lastName.trim();

		const otp = Math.floor(100000 + Math.random() * 900000).toString();
		userData.verificationCode = otp;
		userData.verificationCodeExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
		userData.isEmailVerified = false;

		const user = await new User(userData).save();

		// Send email in background
		sendEmail(
			user.email,
			"Welcome to PetConnect - Verify your email",
			`<p>Hi ${firstName || ""},</p><p>Your verification code is: <strong>${otp}</strong></p><p>This code expires in 10 minutes.</p>`
		);

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

		// Don't return token yet, require verification
		return res.status(201).json({ message: "Registration successful. Please verify your email.", email: user.email });
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

		if (!user.isEmailVerified) {
			const otp = Math.floor(100000 + Math.random() * 900000).toString();
			user.verificationCode = otp;
			user.verificationCodeExpires = new Date(Date.now() + 10 * 60 * 1000);
			await user.save();
			
			sendEmail(
				user.email,
				"Verify your email - PetConnect",
				`<p>Your verification code is: <strong>${otp}</strong></p><p>This code expires in 10 minutes.</p>`
			);
			return res.status(403).json({ message: "Email not verified. A new verification code has been sent to your email.", requiresVerification: true, email: user.email });
		}

		const token = signToken(user);
		
		// Track login info
		const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
		user.lastLoginIp = Array.isArray(ip) ? ip[0] : ip;
		user.lastLoginDate = new Date();
		await user.save();

		return res.json({ user: publicUser(user), token });
	} catch (_error) {
		return res.status(500).json({ message: "failed to login" });
	}
}

export async function updateProfile(req: any, res: Response) {
	try {
		const userId = req.user?.id;
		if (!userId) return res.status(401).json({ message: "Unauthorized" });

		const { firstName, lastName, phone, address } = req.body;

		const user = await User.findById(userId);
		if (!user) return res.status(404).json({ message: "User not found" });

		if (firstName !== undefined) user.firstName = firstName.trim();
		if (lastName !== undefined) user.lastName = lastName.trim();
		if (phone !== undefined) user.phone = phone.trim();
		if (address !== undefined) user.address = address.trim();

		await user.save();

		// Also update Doctor profile if role is veterinarian
		if (user.role === "veterinarian") {
			try {
				const doctor = await Doctor.findOne({ email: user.email });
				if (doctor) {
					if (firstName !== undefined) doctor.firstName = firstName.trim();
					if (lastName !== undefined) doctor.lastName = lastName.trim();
					await doctor.save();
				}
			} catch (e) {
				console.error("Failed to sync doctor profile:", e);
			}
		}

		return res.json({ message: "Profile updated successfully", user: publicUser(user) });
	} catch (error: any) {
		return res.status(500).json({ message: error.message || "Failed to update profile" });
	}
}

export async function requestLoginOtp(req: Request, res: Response) {
	try {
		const { email } = req.body;
		if (!email) return res.status(400).json({ message: "Email is required" });

		const user = await User.findOne({ email });
		if (!user) return res.status(404).json({ message: "User not found" });

		const otp = Math.floor(100000 + Math.random() * 900000).toString();
		user.verificationCode = otp;
		user.verificationCodeExpires = new Date(Date.now() + 10 * 60 * 1000);
		await user.save();

		sendEmail(
			user.email,
			"Login Verification Code - PetConnect",
			`<p>Your login verification code is: <strong>${otp}</strong></p><p>This code expires in 10 minutes.</p>`
		);

		return res.json({ message: "OTP sent successfully" });
	} catch (error) {
		console.error(error);
		return res.status(500).json({ message: "Failed to send OTP" });
	}
}

export async function verifyOtp(req: Request, res: Response) {
	try {
		const { email, otp } = req.body;
		if (!email || !otp) return res.status(400).json({ message: "Email and OTP are required" });

		const user = await User.findOne({ email });
		if (!user) return res.status(404).json({ message: "User not found" });

		// For testing or robustness, trim the OTP
		const providedOtp = otp.toString().trim();
		const savedOtp = user.verificationCode?.trim();

		if (!savedOtp || savedOtp !== providedOtp) {
			return res.status(400).json({ message: "Invalid verification code" });
		}

		if (user.verificationCodeExpires && user.verificationCodeExpires < new Date()) {
			return res.status(400).json({ message: "Verification code expired" });
		}

		// Valid OTP
		user.isEmailVerified = true;
		user.verificationCode = undefined;
		user.verificationCodeExpires = undefined;
		await user.save();

		const token = signToken(user);

		// Track login info
		const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
		user.lastLoginIp = Array.isArray(ip) ? ip[0] : ip;
		user.lastLoginDate = new Date();
		await user.save();

		return res.json({ message: "Verification successful", user: publicUser(user), token });
	} catch (error) {
		console.error(error);
		return res.status(500).json({ message: "Failed to verify OTP" });
	}
}

export async function forgotPassword(req: Request, res: Response) {
	try {
		const { email } = req.body;
		if (!email) return res.status(400).json({ message: "Email is required" });

		const user = await User.findOne({ email });
		if (!user) {
			// Don't leak whether the user exists, just return success
			return res.json({ message: "If an account exists, a reset code has been sent." });
		}

		const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
		user.resetToken = resetCode;
		user.resetTokenExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 mins
		await user.save();

		sendEmail(
			user.email,
			"Password Reset Code - PetConnect",
			`<p>Your password reset code is: <strong>${resetCode}</strong></p><p>This code expires in 15 minutes.</p>`
		);

		return res.json({ message: "If an account exists, a reset code has been sent." });
	} catch (error) {
		console.error("Forgot password error:", error);
		return res.status(500).json({ message: "Failed to process forgot password" });
	}
}

export async function resetPassword(req: Request, res: Response) {
	try {
		const { email, code, newPassword } = req.body;
		if (!email || !code || !newPassword) {
			return res.status(400).json({ message: "Email, code, and new password are required" });
		}
		
		if (newPassword.length < 6) {
			return res.status(400).json({ message: "Password must be at least 6 characters" });
		}

		const user = await User.findOne({ email });
		if (!user) return res.status(404).json({ message: "Invalid code or expired." });

		const providedCode = code.toString().trim();
		const savedCode = user.resetToken?.trim();

		if (!savedCode || savedCode !== providedCode) {
			return res.status(400).json({ message: "Invalid reset code" });
		}

		if (user.resetTokenExpiry && user.resetTokenExpiry < new Date()) {
			return res.status(400).json({ message: "Reset code has expired" });
		}

		// Update to the new password
		user.password = newPassword;
		user.resetToken = undefined;
		user.resetTokenExpiry = undefined;
		await user.save();

		return res.json({ message: "Password has been reset successfully. You can now log in." });
	} catch (error) {
		console.error("Reset password error:", error);
		return res.status(500).json({ message: "Failed to reset password" });
	}
}
