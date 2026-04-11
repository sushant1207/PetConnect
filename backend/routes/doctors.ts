import { Router } from "express";
import Doctor from "../models/Doctor";
import { updateDoctorAvailability, getDoctorByUserId } from "../controller/doctorController";

const router = Router();

/**
 * @swagger
 * /api/doctors:
 *   get:
 *     tags: [Doctors]
 *     summary: Get all active doctors
 *     responses:
 *       200:
 *         description: Active doctors list
 *       500:
 *         description: Server error
 */
router.get("/", async (req, res) => {
	try {
		const doctors = await Doctor.find({ isActive: true })
			.select("-password")
			.sort({ firstName: 1 });
		return res.json({ doctors });
	} catch (error: any) {
		console.error("Get doctors error:", error);
		return res.status(500).json({ message: "Failed to fetch doctors" });
	}
});

/**
 * @swagger
 * /api/doctors/user/{userId}:
 *   get:
 *     tags: [Doctors]
 *     summary: Get doctor profile by linked user ID
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Doctor profile
 *       404:
 *         description: Doctor not found
 */
router.get("/user/:userId", getDoctorByUserId);

/**
 * @swagger
 * /api/doctors/{id}:
 *   get:
 *     tags: [Doctors]
 *     summary: Get doctor by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Doctor details
 *       404:
 *         description: Doctor not found
 */
router.get("/:id", async (req, res) => {
	try {
		const doctor = await Doctor.findById(req.params.id).select("-password");
		if (!doctor) {
			return res.status(404).json({ message: "Doctor not found" });
		}
		return res.json({ doctor });
	} catch (error: any) {
		console.error("Get doctor error:", error);
		return res.status(500).json({ message: "Failed to fetch doctor" });
	}
});

/**
 * @swagger
 * /api/doctors/{doctorId}/availability:
 *   put:
 *     tags: [Doctors]
 *     summary: Update doctor availability settings
 *     parameters:
 *       - in: path
 *         name: doctorId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Availability updated
 *       404:
 *         description: Doctor not found
 */
router.put("/:doctorId/availability", updateDoctorAvailability);

export default router;

