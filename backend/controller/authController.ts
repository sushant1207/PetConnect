import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import User from "../models/User";
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
		const { email, password, role = "user", firstName, lastName } = req.body as { email: string; password: string; role?: string; firstName?: string; lastName?: string };
		if (!email || !password) return res.status(400).json({ message: "email and password are required" });
		if (!["user", "doctor", "staff", "admin"].includes(role)) return res.status(400).json({ message: "invalid role" });

		const exists = await User.findOne({ email });
		if (exists) return res.status(409).json({ message: "email already in use" });

		const user = await User.create({
			email,
			password,
			role,
			firstName,
			lastName,
			isDoctor: role === "doctor",
			isAdmin: role === "admin"
		});

		const token = signToken(user);
		return res.status(201).json({ user: publicUser(user), token });
	} catch (_error) {
		return res.status(500).json({ message: "failed to create user" });
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


