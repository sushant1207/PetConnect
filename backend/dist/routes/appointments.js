"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const appointmentController_1 = require("../controller/appointmentController");
const router = (0, express_1.Router)();
/**
 * @swagger
 * /api/appointments/availability:
 *   get:
 *     tags: [Appointments]
 *     summary: Get available appointment slots for a doctor on a date
 *     parameters:
 *       - in: query
 *         name: doctorId
 *         schema:
 *           type: string
 *         required: true
 *         description: Doctor ID
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *         required: true
 *         description: Date in YYYY-MM-DD
 *     responses:
 *       200:
 *         description: Available slots
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AvailabilityResponse'
 *       400:
 *         description: Missing or invalid parameters
 *       404:
 *         description: Doctor not found
 */
router.get("/availability", appointmentController_1.getAvailability);
/**
 * @swagger
 * /api/appointments:
 *   post:
 *     tags: [Appointments]
 *     summary: Create an appointment
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AppointmentCreateRequest'
 *     responses:
 *       201:
 *         description: Appointment created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Appointment booked
 *                 appointment:
 *                   $ref: '#/components/schemas/Appointment'
 *       400:
 *         description: Validation error
 *       404:
 *         description: Doctor not found
 *       409:
 *         description: Slot conflict
 *       500:
 *         description: Server error
 */
router.post("/", appointmentController_1.createAppointment);
exports.default = router;
