import { Request, Response } from "express";
import Appointment from "../models/Appointment";
import Doctor from "../models/Doctor";
import User from "../models/User";
import { DayOfWeek, generateSlotsForDay, getDayOfWeek, parseAvailabilityEntry, slotOverlaps } from "../utils/slotValidation";
import { buildEsewaFormData } from "../utils/esewa";
import { sendEmail } from "../utils/mailer";

const NPT_OFFSET_MINUTES = 5 * 60 + 45;
const MORNING_REMINDER_HOUR_NPT = Number(process.env.APPOINTMENT_MORNING_REMINDER_HOUR_NPT || 8);
const PREVIOUS_DAY_REMINDER_HOUR_NPT = Number(process.env.APPOINTMENT_PREVIOUS_DAY_REMINDER_HOUR_NPT || 18);

const getAppointmentStartDate = (appointmentDate: Date, timeSlot: string): Date | null => {
	const [start] = String(timeSlot || "").split("-");
	if (!start || !start.includes(":")) return null;
	const [hoursStr, minutesStr] = start.split(":");
	const hours = Number(hoursStr);
	const minutes = Number(minutesStr);
	if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;

	const startAt = new Date(appointmentDate);
	startAt.setHours(hours, minutes, 0, 0);
	return startAt;
};

export async function processDueAppointmentReminders() {
	try {
		const now = new Date();

		const shiftDateKey = (dateKey: string, deltaDays: number): string => {
			const [y, m, d] = dateKey.split("-").map(Number);
			const shifted = new Date(Date.UTC(y, (m || 1) - 1, d || 1));
			shifted.setUTCDate(shifted.getUTCDate() + deltaDays);
			return shifted.toISOString().split("T")[0];
		};

		const nptDateTimeToUtc = (dateKey: string, hour: number, minute = 0): Date => {
			const [y, m, d] = dateKey.split("-").map(Number);
			const utcMillis = Date.UTC(y, (m || 1) - 1, d || 1, hour, minute, 0, 0) - NPT_OFFSET_MINUTES * 60 * 1000;
			return new Date(utcMillis);
		};

		const appointments = await Appointment.find({
			status: "confirmed",
			date: { $gte: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000) }
		})
			.populate("user", "email firstName")
			.populate("doctor", "firstName lastName");

		for (const appointment of appointments) {
			const startAt = getAppointmentStartDate(new Date(appointment.date), appointment.timeSlot);
			if (!startAt) continue;
			if (startAt <= now) continue;

			const appointmentDateKey = new Date(appointment.date).toISOString().split("T")[0];
			const previousDayDateKey = shiftDateKey(appointmentDateKey, -1);

			const previousDayReminderAt = nptDateTimeToUtc(previousDayDateKey, PREVIOUS_DAY_REMINDER_HOUR_NPT, 0);
			const morningReminderAt = nptDateTimeToUtc(appointmentDateKey, MORNING_REMINDER_HOUR_NPT, 0);

			const user = appointment.user as any;
			const doctor = appointment.doctor as any;
			if (!user?.email) continue;

			if (!appointment.reminderEveningSentAt && now >= previousDayReminderAt) {
				await sendEmail(
					user.email,
					"Appointment Reminder (Evening) - PetConnect",
					`
					<h3>Appointment Reminder</h3>
					<p>Dear ${user.firstName || "Customer"},</p>
					<p>This is your evening reminder for tomorrow's appointment.</p>
					<ul>
						<li><strong>Date:</strong> ${new Date(appointment.date).toLocaleDateString()}</li>
						<li><strong>Time:</strong> ${appointment.timeSlot}</li>
						<li><strong>Pet:</strong> ${appointment.petName}</li>
						<li><strong>Doctor:</strong> Dr. ${doctor?.firstName || ""} ${doctor?.lastName || ""}</li>
					</ul>
					<p>Please be ready for your appointment. Thank you for using PetConnect.</p>
					`
				);
				appointment.reminderEveningSentAt = new Date();
			}

			if (!appointment.reminderMorningSentAt && now >= morningReminderAt) {
				await sendEmail(
					user.email,
					"Appointment Reminder (Morning) - PetConnect",
					`
					<h3>Appointment Reminder</h3>
					<p>Dear ${user.firstName || "Customer"},</p>
					<p>This is your morning reminder for today's appointment.</p>
					<ul>
						<li><strong>Date:</strong> ${new Date(appointment.date).toLocaleDateString()}</li>
						<li><strong>Time:</strong> ${appointment.timeSlot}</li>
						<li><strong>Pet:</strong> ${appointment.petName}</li>
						<li><strong>Doctor:</strong> Dr. ${doctor?.firstName || ""} ${doctor?.lastName || ""}</li>
					</ul>
					<p>Please arrive 10 minutes early. Thank you for using PetConnect.</p>
					`
				);
				appointment.reminderMorningSentAt = new Date();
			}

			if (appointment.isModified("reminderEveningSentAt") || appointment.isModified("reminderMorningSentAt")) {
				await appointment.save();
			}
		}
	} catch (error) {
		console.error("Appointment reminder processing error:", error);
	}
}

export async function getAvailability(req: Request, res: Response) {
	try {
		const { doctorId, date } = req.query as { doctorId?: string; date?: string };
		if (!doctorId || !date) {
			return res.status(400).json({ message: "doctorId and date are required (YYYY-MM-DD)" });
		}
		const doctor = await Doctor.findById(doctorId).select("availability appointmentDuration");
		if (!doctor) return res.status(404).json({ message: "Doctor not found" });

		const selectedDate = new Date(date);
		if (isNaN(selectedDate.getTime())) return res.status(400).json({ message: "Invalid date" });
		const day: DayOfWeek = getDayOfWeek(selectedDate);

		const entry = doctor.availability
			.map(parseAvailabilityEntry)
			.find((e) => e && e.day === day) || null;

		if (!entry) return res.json({ date, slots: [] });

		const baseSlots = generateSlotsForDay(selectedDate, entry!.startHour, entry!.endHour, doctor.appointmentDuration || 30);

		const sameDayAppointments = await Appointment.find({
			doctor: doctorId,
			status: { $ne: "cancelled" },
			date: {
				$gte: new Date(new Date(date).setHours(0, 0, 0, 0)),
				$lte: new Date(new Date(date).setHours(23, 59, 59, 999))
			}
		}).select("timeSlot");

		const booked = new Set(sameDayAppointments.map((a) => a.timeSlot));
		const available = baseSlots.filter((slot) => {
			// block exact or overlapping existing slots
			for (const existing of booked) {
				if (existing === slot || slotOverlaps(slot, existing)) return false;
			}
			return true;
		});

		return res.json({ date, slots: available });
	} catch (error) {
		return res.status(500).json({ message: "Failed to compute availability" });
	}
}

export async function createAppointment(req: Request, res: Response) {
	try {
		const {
			user,
			doctor: doctorId,
			date,
			timeSlot,
			petName,
			petType,
			reason,
			locationPreference,
			address,
			notes,
			petId
		} = req.body;

		if (!user || !doctorId || !date || !timeSlot || !petName || !petType || !reason || !locationPreference) {
			return res.status(400).json({ message: "Missing required fields" });
		}

		const doctor = await Doctor.findById(doctorId).select("availability appointmentDuration bookingFee");
		if (!doctor) return res.status(404).json({ message: "Doctor not found" });

		const selectedDate = new Date(date);
		if (isNaN(selectedDate.getTime())) return res.status(400).json({ message: "Invalid date" });
		const day: DayOfWeek = getDayOfWeek(selectedDate);

		const availability = doctor.availability.map(parseAvailabilityEntry).find((e) => e && e.day === day);
		if (!availability) return res.status(400).json({ message: "Doctor not available on selected day" });

		// Check slot fits within the doctor's working hours
		const generated = generateSlotsForDay(selectedDate, availability.startHour, availability.endHour, doctor.appointmentDuration || 30);
		if (!generated.includes(timeSlot)) {
			return res.status(400).json({ message: "Requested timeSlot is not within doctor's availability" });
		}

		// Check for conflicts
		const conflict = await Appointment.findOne({
			doctor: doctorId,
			status: { $ne: "cancelled" },
			date: {
				$gte: new Date(new Date(date).setHours(0, 0, 0, 0)),
				$lte: new Date(new Date(date).setHours(23, 59, 59, 999))
			},
			$or: [{ timeSlot }, { timeSlot: { $in: generated.filter((slot) => slotOverlaps(slot, timeSlot)) } }]
		});
		if (conflict) return res.status(409).json({ message: "Selected timeSlot is already booked for this doctor" });

		const userConflict = await Appointment.findOne({
			user,
			status: { $ne: "cancelled" },
			date: {
				$gte: new Date(new Date(date).setHours(0, 0, 0, 0)),
				$lte: new Date(new Date(date).setHours(23, 59, 59, 999))
			},
			$or: [{ timeSlot }, { timeSlot: { $in: generated.filter((slot) => slotOverlaps(slot, timeSlot)) } }]
		});
		if (userConflict) return res.status(409).json({ message: "You already have an appointment during this time" });

		const created = await Appointment.create({
			user,
			doctor: doctorId,
			date: selectedDate,
			timeSlot,
			petName,
			petType,
			reason,
			locationPreference,
			address,
			notes,
			status: "pending",
			appointmentDuration: doctor.appointmentDuration || 30,
			payment: { status: "pending", amount: doctor.bookingFee || 0 }
		});

		// Send email since it's booked (direct creation)
		const userData = await User.findById(user).select("email firstName");
		if (userData && userData.email) {
			sendEmail(
				userData.email,
				"Appointment Request Received - PetConnect",
				`
				<h3>Your Appointment Request</h3>
				<p>Dear ${userData.firstName || 'Customer'},</p>
				<p>We've received your appointment request for <strong>${petName}</strong> on <strong>${selectedDate.toLocaleDateString()}</strong> at <strong>${timeSlot}</strong>.</p>
				<p>Status: Pending confirmation.</p>
				<p>Thank you for using PetConnect!</p>
				`
			);
		}

		return res.status(201).json({ message: "Appointment booked", appointment: created });
	} catch (error: any) {
		console.error("Create appointment error:", error);
		return res.status(500).json({ message: error.message || "Failed to create appointment" });
	}
}

export async function getAppointmentsByDoctor(req: Request, res: Response) {
	try {
		const { doctorId } = req.params;
		
		// Try to find doctor by ID first
		let doctor = await Doctor.findById(doctorId);
		
		// If not found, try to find by user ID (when doctorId is actually userId)
		if (!doctor) {
			const User = (await import("../models/User")).default;
			const user = await User.findById(doctorId);
			if (user && user.role === "veterinarian") {
				doctor = await Doctor.findOne({ email: user.email });
			}
		}
		
		if (!doctor) {
			return res.status(404).json({ message: "Doctor not found" });
		}
		
		const appointments = await Appointment.find({ doctor: doctor._id })
			.populate("user", "firstName lastName email phone")
			.sort({ date: 1, timeSlot: 1 });
		return res.json({ appointments });
	} catch (error: any) {
		console.error("Get appointments error:", error);
		return res.status(500).json({ message: "Failed to fetch appointments" });
	}
}

export async function getAppointmentsByUser(req: Request, res: Response) {
	try {
		const { userId } = req.params;
		const appointments = await Appointment.find({ user: userId })
			.populate("doctor", "firstName lastName specialization")
			.sort({ date: -1, timeSlot: 1 });
		return res.json({ appointments });
	} catch (error: any) {
		console.error("Get appointments error:", error);
		return res.status(500).json({ message: "Failed to fetch appointments" });
	}
}

export async function initiateAppointmentPayment(req: Request, res: Response) {
	try {
		const {
			user,
			doctor: doctorId,
			date,
			timeSlot,
			petName,
			petType,
			reason,
			locationPreference,
			address,
			notes,
			petId
		} = req.body;

		if (!user || !doctorId || !date || !timeSlot || !petName || !petType || !reason || !locationPreference) {
			return res.status(400).json({ message: "Missing required fields" });
		}

		const doctor = await Doctor.findById(doctorId).select("availability appointmentDuration bookingFee");
		if (!doctor) return res.status(404).json({ message: "Doctor not found" });

		const selectedDate = new Date(date);
		if (isNaN(selectedDate.getTime())) return res.status(400).json({ message: "Invalid date" });
		const day: DayOfWeek = getDayOfWeek(selectedDate);

		const availability = doctor.availability.map(parseAvailabilityEntry).find((e) => e && e.day === day);
		if (!availability) return res.status(400).json({ message: "Doctor not available on selected day" });

		const generated = generateSlotsForDay(selectedDate, availability.startHour, availability.endHour, doctor.appointmentDuration || 30);
		if (!generated.includes(timeSlot)) {
			return res.status(400).json({ message: "Requested timeSlot is not within doctor's availability" });
		}

		const conflict = await Appointment.findOne({
			doctor: doctorId,
			status: { $ne: "cancelled" },
			date: {
				$gte: new Date(new Date(date).setHours(0, 0, 0, 0)),
				$lte: new Date(new Date(date).setHours(23, 59, 59, 999))
			},
			$or: [{ timeSlot }, { timeSlot: { $in: generated.filter((slot) => slotOverlaps(slot, timeSlot)) } }]
		});
		if (conflict) return res.status(409).json({ message: "Selected timeSlot is already booked for this doctor" });

		const userConflict = await Appointment.findOne({
			user,
			status: { $ne: "cancelled" },
			date: {
				$gte: new Date(new Date(date).setHours(0, 0, 0, 0)),
				$lte: new Date(new Date(date).setHours(23, 59, 59, 999))
			},
			$or: [{ timeSlot }, { timeSlot: { $in: generated.filter((slot) => slotOverlaps(slot, timeSlot)) } }]
		});
		if (userConflict) return res.status(409).json({ message: "You already have an appointment during this time" });

		const amount = doctor.bookingFee || 0;
		const created = await Appointment.create({
			user,
			doctor: doctorId,
			date: selectedDate,
			timeSlot,
			petName,
			petType,
			reason,
			locationPreference,
			address,
			notes,
			status: "pending",
			appointmentDuration: doctor.appointmentDuration || 30,
			payment: {
				status: "pending",
				amount,
				method: "esewa"
			}
		});

		const esewaData = buildEsewaFormData({
			amount,
			transactionUuid: String(created._id),
			successPath: `/dashboard/appointments/payment/success?appointmentId=${created._id}`,
			failurePath: `/dashboard/appointments/payment/failure?appointmentId=${created._id}`,
		});

		return res.status(201).json({
			message: "Appointment created, redirect to eSewa",
			appointmentId: created._id,
			esewaData,
		});
	} catch (error: any) {
		console.error("Initiate appointment payment error:", error);
		return res.status(500).json({ error: error.message || "Failed to initiate payment" });
	}
}

export async function verifyAppointmentPayment(req: Request, res: Response) {
	try {
		const { appointmentId, status, refId } = req.body;

		const appointment = await Appointment.findById(appointmentId).populate("user", "email firstName").populate("doctor", "firstName lastName");
		if (!appointment) return res.status(404).json({ message: "Appointment not found" });

		if (status === "COMPLETE" || status === "success") {
			appointment.payment.status = "paid";
			appointment.payment.method = "esewa";
			appointment.payment.transactionId = refId || (req.body as any).transaction_code;
			appointment.payment.paidAt = new Date();

			const commissionRate = 0.10;
			appointment.payment.platformFee = appointment.payment.amount * commissionRate;
			appointment.payment.netAmount = appointment.payment.amount - appointment.payment.platformFee;

			appointment.status = "confirmed";
			await appointment.save();

			const user = appointment.user as any;
			const doc = appointment.doctor as any;
			if (user && user.email) {
				sendEmail(
					user.email,
					"Appointment Confirmed - PetConnect",
					`
					<h3>Your Appointment is Confirmed!</h3>
					<p>Dear ${user.firstName || 'Customer'},</p>
					<p>Your appointment with Dr. ${doc?.firstName || ''} ${doc?.lastName || ''} has been successfully paid and confirmed.</p>
					<ul>
						<li><strong>Date:</strong> ${new Date(appointment.date).toLocaleDateString()}</li>
						<li><strong>Time Slot:</strong> ${appointment.timeSlot}</li>
						<li><strong>Pet Name:</strong> ${appointment.petName}</li>
						<li><strong>Reason:</strong> ${appointment.reason}</li>
					</ul>
					<p>Thank you for using PetConnect!</p>
					`
				);
			}
		} else {
			appointment.payment.status = "pending";
			await appointment.save();
		}

		return res.status(200).json({ message: "Payment verified", appointment });
	} catch (error: any) {
		return res.status(500).json({ error: error.message || "Failed to verify payment" });
	}
}

export async function updateAppointmentStatus(req: Request, res: Response) {
	try {
		const { id } = req.params;
		const { status, cancellationReason } = req.body;

		const appointment = await Appointment.findByIdAndUpdate(
			id,
			{ status, cancellationReason },
			{ new: true, runValidators: true }
		).populate("user", "firstName lastName email").populate("doctor", "firstName lastName");

		if (!appointment) {
			return res.status(404).json({ message: "Appointment not found" });
		}

		return res.json({ message: "Appointment updated", appointment });
	} catch (error: any) {
		console.error("Update appointment error:", error);
		return res.status(500).json({ message: "Failed to update appointment" });
	}
}
