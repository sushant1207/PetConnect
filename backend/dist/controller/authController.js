"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.signup = signup;
exports.login = login;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = __importDefault(require("../models/User"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
function signToken(user) {
    const secret = process.env.JWT_SECRET || "dev_secret";
    return jsonwebtoken_1.default.sign({ sub: user._id.toString(), role: user.role }, secret, { expiresIn: "7d" });
}
function publicUser(user) {
    const { password, __v, resetToken, resetTokenExpiry, emailVerificationToken, verificationCode, ...rest } = user.toObject ? user.toObject() : user;
    return rest;
}
async function signup(req, res) {
    try {
        const { email, password, role = "user", firstName, lastName } = req.body;
        if (!email || !password)
            return res.status(400).json({ message: "email and password are required" });
        if (!["user", "doctor", "staff", "admin"].includes(role))
            return res.status(400).json({ message: "invalid role" });
        const exists = await User_1.default.findOne({ email });
        if (exists)
            return res.status(409).json({ message: "email already in use" });
        const user = await User_1.default.create({
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
    }
    catch (_error) {
        return res.status(500).json({ message: "failed to create user" });
    }
}
async function login(req, res) {
    try {
        const { email, password } = req.body;
        if (!email || !password)
            return res.status(400).json({ message: "email and password are required" });
        const user = await User_1.default.findOne({ email }).select("+password");
        if (!user)
            return res.status(401).json({ message: "invalid credentials" });
        const ok = await bcryptjs_1.default.compare(password, user.password);
        if (!ok)
            return res.status(401).json({ message: "invalid credentials" });
        const token = signToken(user);
        return res.json({ user: publicUser(user), token });
    }
    catch (_error) {
        return res.status(500).json({ message: "failed to login" });
    }
}
