"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAvailability = getAvailability;
exports.createAppointment = createAppointment;
const Appointment_1 = __importDefault(require("../models/Appointment"));
const Doctor_1 = __importDefault(require("../models/Doctor"));
const slotValidation_1 = require("../utils/slotValidation");
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
        const { user, doctor: doctorId, date, timeSlot, petName, petType, reason, locationPreference, address, notes } = req.body;
        if (!user || !doctorId || !date || !timeSlot || !petName || !petType || !reason || !locationPreference) {
            return res.status(400).json({ message: "Missing required fields" });
        }
        const doctor = await Doctor_1.default.findById(doctorId).select("availability appointmentDuration");
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
            payment: { status: "pending", amount: 0 }
        });
        return res.status(201).json({ message: "Appointment booked", appointment: created });
    }
    catch (_error) {
        return res.status(500).json({ message: "Failed to create appointment" });
    }
}
