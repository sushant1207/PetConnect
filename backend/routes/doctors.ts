import { Router } from "express";
import Doctor from "../models/Doctor";
import { updateDoctorAvailability, getDoctorByUserId } from "../controller/doctorController";

const router = Router();

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

router.get("/user/:userId", getDoctorByUserId);

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

router.put("/:doctorId/availability", updateDoctorAvailability);

export default router;

