"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authController_1 = require("../controller/authController");
const auth_1 = require("../utils/auth");
const router = (0, express_1.Router)();
/**
 * @swagger
 * /api/auth/signup:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AuthSignupRequest'
 *     responses:
 *       201:
 *         description: User account created
 *       400:
 *         description: Validation error or duplicate user
 */
router.post("/signup", authController_1.signup);
/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login with email and password
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AuthLoginRequest'
 *     responses:
 *       200:
 *         description: Authenticated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       401:
 *         description: Invalid credentials
 */
router.post("/login", authController_1.login);
/**
 * @swagger
 * /api/auth/request-otp:
 *   post:
 *     tags: [Auth]
 *     summary: Request one-time password for login
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: OTP sent if account exists
 */
router.post("/request-otp", authController_1.requestLoginOtp);
/**
 * @swagger
 * /api/auth/verify-otp:
 *   post:
 *     tags: [Auth]
 *     summary: Verify OTP and sign in
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, otp]
 *             properties:
 *               email:
 *                 type: string
 *               otp:
 *                 type: string
 *     responses:
 *       200:
 *         description: OTP verified
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       401:
 *         description: Invalid or expired OTP
 */
router.post("/verify-otp", authController_1.verifyOtp);
/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     tags: [Auth]
 *     summary: Request password reset token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password reset email queued
 */
router.post("/forgot-password", authController_1.forgotPassword);
/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     tags: [Auth]
 *     summary: Reset password using reset token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token, password]
 *             properties:
 *               token:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password updated
 *       400:
 *         description: Invalid or expired token
 */
router.post("/reset-password", authController_1.resetPassword);
/**
 * @swagger
 * /api/auth/profile:
 *   put:
 *     tags: [Auth]
 *     summary: Update profile of authenticated user
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               phone:
 *                 type: string
 *               address:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated
 *       401:
 *         description: Unauthorized
 */
router.put("/profile", auth_1.authenticate, authController_1.updateProfile);
exports.default = router;
