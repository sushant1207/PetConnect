import { Router } from "express";
import { login, signup, updateProfile, requestLoginOtp, verifyOtp, forgotPassword, resetPassword } from "../controller/authController";
import { authenticate } from "../utils/auth";

const router = Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/request-otp", requestLoginOtp);
router.post("/verify-otp", verifyOtp);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

router.put("/profile", authenticate as any, updateProfile);

export default router;


