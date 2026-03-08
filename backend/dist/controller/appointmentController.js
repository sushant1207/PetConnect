"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAvailability = getAvailability;
exports.createAppointment = createAppointment;
exports.getAppointmentsByDoctor = getAppointmentsByDoctor;
exports.getAppointmentsByUser = getAppointmentsByUser;
exports.initiateAppointmentPayment = initiateAppointmentPayment;
exports.verifyAppointmentPayment = verifyAppointmentPayment;
exports.updateAppointmentStatus = updateAppointmentStatus;
const Appointment_1 = __importDefault(require("../models/Appointment"));
const Doctor_1 = __importDefault(require("../models/Doctor"));
const slotValidation_1 = require("../utils/slotValidation");
const esewa_1 = require("../utils/esewa");
async function getAvailability(req, res) {
    try {
        const { doctorId, date } = req.query;
        if (!doctorId || !date) {
            return res.status(400).json({ message: "doctorId and date are required (YYYY-MM-DD)" });
        }
        const doctor = await Doctor_1.default.findById(doctorId).select("availability appointmentDuration");
        if (!doctor)
            return res.status(404).json({ message: "Doctor not found" });
        const selectedDate = new Date(date);
        if (isNaN(selectedDate.getTime()))
            return res.status(400).json({ message: "Invalid date" });
        const day = (0, slotValidation_1.getDayOfWeek)(selectedDate);
        const entry = doctor.availability
            .map(slotValidation_1.parseAvailabilityEntry)
            .find((e) => e && e.day === day) || null;
        if (!entry)
            return res.json({ date, slots: [] });
        const baseSlots = (0, slotValidation_1.generateSlotsForDay)(selectedDate, entry.startHour, entry.endHour, doctor.appointmentDuration || 30);
        const sameDayAppointments = await Appointment_1.default.find({
            doctor: doctorId,
            date: {
                $gte: new Date(new Date(date).setHours(0, 0, 0, 0)),
                $lte: new Date(new Date(date).setHours(23, 59, 59, 999))
            }
        }).select("timeSlot");
        const booked = new Set(sameDayAppointments.map((a) => a.timeSlot));
        const available = baseSlots.filter((slot) => {
            // block exact or overlapping existing slots
            for (const existing of booked) {
                if (existing === slot || (0, slotValidation_1.slotOverlaps)(slot, existing))
                    return false;
            }
            return true;
        });
        return res.json({ date, slots: available });
    }
    catch (error) {
        return res.status(500).json({ message: "Failed to compute availability" });
    }
}
async function createAppointment(req, res) {
    try {
        const { user, doctor: doctorId, date, timeSlot, petName, petType, reason, locationPreference, address, notes, petId } = req.body;
        if (!user || !doctorId || !date || !timeSlot || !petName || !petType || !reason || !locationPreference) {
            return res.status(400).json({ message: "Missing required fields" });
        }
        const doctor = await Doctor_1.default.findById(doctorId).select("availability appointmentDuration bookingFee");
        if (!doctor)
            return res.status(404).json({ message: "Doctor not found" });
        const selectedDate = new Date(date);
        if (isNaN(selectedDate.getTime()))
            return res.status(400).json({ message: "Invalid date" });
        const day = (0, slotValidation_1.getDayOfWeek)(selectedDate);
        const availability = doctor.availability.map(slotValidation_1.parseAvailabilityEntry).find((e) => e && e.day === day);
        if (!availability)
            return res.status(400).json({ message: "Doctor not available on selected day" });
        // Check slot fits within the doctor's working hours
        const generated = (0, slotValidation_1.generateSlotsForDay)(selectedDate, availability.startHour, availability.endHour, doctor.appointmentDuration || 30);
        if (!generated.includes(timeSlot)) {
            return res.status(400).json({ message: "Requested timeSlot is not within doctor's availability" });
        }
        // Check for conflicts
        const conflict = await Appointment_1.default.findOne({
            doctor: doctorId,
            date: {
                $gte: new Date(new Date(date).setHours(0, 0, 0, 0)),
                $lte: new Date(new Date(date).setHours(23, 59, 59, 999))
            },
            $or: [{ timeSlot }, { timeSlot: { $in: generated.filter((slot) => (0, slotValidation_1.slotOverlaps)(slot, timeSlot)) } }]
        });
        if (conflict)
            return res.status(409).json({ message: "Selected timeSlot is already booked" });
        const created = await Appointment_1.default.create({
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
        return res.status(201).json({ message: "Appointment booked", appointment: created });
    }
    catch (error) {
        console.error("Create appointment error:", error);
        return res.status(500).json({ message: error.message || "Failed to create appointment" });
    }
}
async function getAppointmentsByDoctor(req, res) {
    try {
        const { doctorId } = req.params;
        // Try to find doctor by ID first
        let doctor = await Doctor_1.default.findById(doctorId);
        // If not found, try to find by user ID (when doctorId is actually userId)
        if (!doctor) {
            const User = (await Promise.resolve().then(() => __importStar(require("../models/User")))).default;
            const user = await User.findById(doctorId);
            if (user && user.role === "veterinarian") {
                doctor = await Doctor_1.default.findOne({ email: user.email });
            }
        }
        if (!doctor) {
            return res.status(404).json({ message: "Doctor not found" });
        }
        const appointments = await Appointment_1.default.find({ doctor: doctor._id })
            .populate("user", "firstName lastName email phone")
            .sort({ date: 1, timeSlot: 1 });
        return res.json({ appointments });
    }
    catch (error) {
        console.error("Get appointments error:", error);
        return res.status(500).json({ message: "Failed to fetch appointments" });
    }
}
async function getAppointmentsByUser(req, res) {
    try {
        const { userId } = req.params;
        const appointments = await Appointment_1.default.find({ user: userId })
            .populate("doctor", "firstName lastName specialization")
            .sort({ date: -1, timeSlot: 1 });
        return res.json({ appointments });
    }
    catch (error) {
        console.error("Get appointments error:", error);
        return res.status(500).json({ message: "Failed to fetch appointments" });
    }
}
async function initiateAppointmentPayment(req, res) {
    try {
        const { user, doctor: doctorId, date, timeSlot, petName, petType, reason, locationPreference, address, notes, petId } = req.body;
        if (!user || !doctorId || !date || !timeSlot || !petName || !petType || !reason || !locationPreference) {
            return res.status(400).json({ message: "Missing required fields" });
        }
        const doctor = await Doctor_1.default.findById(doctorId).select("availability appointmentDuration bookingFee");
        if (!doctor)
            return res.status(404).json({ message: "Doctor not found" });
        const selectedDate = new Date(date);
        if (isNaN(selectedDate.getTime()))
            return res.status(400).json({ message: "Invalid date" });
        const day = (0, slotValidation_1.getDayOfWeek)(selectedDate);
        const availability = doctor.availability.map(slotValidation_1.parseAvailabilityEntry).find((e) => e && e.day === day);
        if (!availability)
            return res.status(400).json({ message: "Doctor not available on selected day" });
        const generated = (0, slotValidation_1.generateSlotsForDay)(selectedDate, availability.startHour, availability.endHour, doctor.appointmentDuration || 30);
        if (!generated.includes(timeSlot)) {
            return res.status(400).json({ message: "Requested timeSlot is not within doctor's availability" });
        }
        const conflict = await Appointment_1.default.findOne({
            doctor: doctorId,
            date: {
                $gte: new Date(new Date(date).setHours(0, 0, 0, 0)),
                $lte: new Date(new Date(date).setHours(23, 59, 59, 999))
            },
            $or: [{ timeSlot }, { timeSlot: { $in: generated.filter((slot) => (0, slotValidation_1.slotOverlaps)(slot, timeSlot)) } }]
        });
        if (conflict)
            return res.status(409).json({ message: "Selected timeSlot is already booked" });
        const amount = doctor.bookingFee || 0;
        const created = await Appointment_1.default.create({
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
        const esewaData = (0, esewa_1.buildEsewaFormData)({
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
    }
    catch (error) {
        console.error("Initiate appointment payment error:", error);
        return res.status(500).json({ error: error.message || "Failed to initiate payment" });
    }
}
async function verifyAppointmentPayment(req, res) {
    try {
        const { appointmentId, status, refId } = req.body;
        const appointment = await Appointment_1.default.findById(appointmentId);
        if (!appointment)
            return res.status(404).json({ message: "Appointment not found" });
        if (status === "COMPLETE" || status === "success") {
            appointment.payment.status = "paid";
            appointment.payment.method = "esewa";
            appointment.payment.transactionId = refId || req.body.transaction_code;
            appointment.payment.paidAt = new Date();
            appointment.status = "confirmed";
            await appointment.save();
        }
        else {
            appointment.payment.status = "pending";
            await appointment.save();
        }
        return res.status(200).json({ message: "Payment verified", appointment });
    }
    catch (error) {
        return res.status(500).json({ error: error.message || "Failed to verify payment" });
    }
}
async function updateAppointmentStatus(req, res) {
    try {
        const { id } = req.params;
        const { status, cancellationReason } = req.body;
        const appointment = await Appointment_1.default.findByIdAndUpdate(id, { status, cancellationReason }, { new: true, runValidators: true }).populate("user", "firstName lastName email").populate("doctor", "firstName lastName");
        if (!appointment) {
            return res.status(404).json({ message: "Appointment not found" });
        }
        return res.json({ message: "Appointment updated", appointment });
    }
    catch (error) {
        console.error("Update appointment error:", error);
        return res.status(500).json({ message: "Failed to update appointment" });
    }
}
