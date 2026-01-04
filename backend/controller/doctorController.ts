import { Request, Response } from "express";
import Doctor from "../models/Doctor";
import User from "../models/User";
import bcrypt from "bcryptjs";

export async function updateDoctorAvailability(req: Request, res: Response) {
	try {
		const { doctorId } = req.params;
		const { availability, appointmentDuration, bookingFee, clinicAddress, locationPreference, specialization, experience, bio } = req.body;

		// Find doctor by ID or by user ID
		let doctor = await Doctor.findById(doctorId);
		if (!doctor) {
			// Try finding by user email if doctorId is actually a userId
			const user = await User.findById(doctorId);
			if (user && user.role === "veterinarian") {
				doctor = await Doctor.findOne({ email: user.email });
				
				// If still not found, create a new doctor profile
				if (!doctor) {
					// Create doctor with a placeholder password (login uses User model, not Doctor)
					const salt = await bcrypt.genSalt(10);
					const tempPassword = await bcrypt.hash("doctor_profile_only_" + Date.now(), salt);
					
					doctor = await Doctor.create({
						firstName: user.firstName || "Veterinarian",
						lastName: user.lastName || "",
						email: user.email,
						password: tempPassword, // Placeholder password, login uses User model
						specialization: specialization || "General Practice",
						experience: experience || 0,
						bio: bio || "",
						availability: availability || [],
						appointmentDuration: appointmentDuration || 30,
						bookingFee: bookingFee || 500,
						clinicAddress: clinicAddress || "",
						locationPreference: locationPreference || "clinic",
					});
					const updated = await Doctor.findById(doctor._id).select("-password");
					return res.json({ message: "Doctor profile created and availability updated", doctor: updated });
				}
			}
		}

		if (!doctor) {
			return res.status(404).json({ message: "Doctor not found" });
		}

		const updates: any = {};
		if (availability !== undefined) updates.availability = availability;
		if (appointmentDuration !== undefined) updates.appointmentDuration = appointmentDuration;
		if (bookingFee !== undefined) updates.bookingFee = bookingFee;
		if (clinicAddress !== undefined) updates.clinicAddress = clinicAddress;
		if (locationPreference !== undefined) updates.locationPreference = locationPreference;
		if (specialization !== undefined) updates.specialization = specialization;
		if (experience !== undefined) updates.experience = experience;
		if (bio !== undefined) updates.bio = bio;

		const updated = await Doctor.findByIdAndUpdate(doctor._id, updates, { new: true, runValidators: true }).select("-password");

		return res.json({ message: "Availability updated successfully", doctor: updated });
	} catch (error: any) {
		console.error("Update availability error:", error);
		if (error.name === "ValidationError") {
			return res.status(400).json({ message: error.message });
		}
		return res.status(500).json({ message: error.message || "Failed to update availability" });
	}
}

export async function getDoctorByUserId(req: Request, res: Response) {
	try {
		const { userId } = req.params;
		const user = await User.findById(userId);
		if (!user || user.role !== "veterinarian") {
			return res.status(404).json({ message: "Veterinarian not found" });
		}

		const doctor = await Doctor.findOne({ email: user.email }).select("-password");
		if (!doctor) {
			return res.status(404).json({ message: "Doctor profile not found" });
		}

		return res.json({ doctor });
	} catch (error: any) {
		console.error("Get doctor error:", error);
		return res.status(500).json({ message: "Failed to fetch doctor" });
	}
}

