import { Router } from "express";
import {
	createAppointment,
	initiateAppointmentPayment,
	verifyAppointmentPayment,
	getAvailability,
	getAppointmentsByDoctor,
	getAppointmentsByUser,
	updateAppointmentStatus
} from "../controller/appointmentController";

const router = Router();

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
router.get("/availability", getAvailability);

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
router.post("/", createAppointment);

/**
 * @swagger
 * /api/appointments/pay/esewa:
 *   post:
 *     tags: [Appointments]
 *     summary: Initiate eSewa payment for an appointment
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [appointmentId]
 *             properties:
 *               appointmentId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Payment initiation payload
 *       400:
 *         description: Invalid appointment or payment state
 */
router.post("/pay/esewa", initiateAppointmentPayment);

/**
 * @swagger
 * /api/appointments/pay/verify:
 *   post:
 *     tags: [Appointments]
 *     summary: Verify appointment payment transaction
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [oid, amt, refId]
 *             properties:
 *               oid:
 *                 type: string
 *               amt:
 *                 type: string
 *               refId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Payment verified and appointment updated
 *       400:
 *         description: Payment verification failed
 */
router.post("/pay/verify", verifyAppointmentPayment);

/**
 * @swagger
 * /api/appointments/doctor/{doctorId}:
 *   get:
 *     tags: [Appointments]
 *     summary: Get appointments for a doctor
 *     parameters:
 *       - in: path
 *         name: doctorId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Doctor appointment list
 *       404:
 *         description: Doctor not found
 */
router.get("/doctor/:doctorId", getAppointmentsByDoctor);

/**
 * @swagger
 * /api/appointments/user/{userId}:
 *   get:
 *     tags: [Appointments]
 *     summary: Get appointments for a user
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User appointment list
 *       404:
 *         description: User not found
 */
router.get("/user/:userId", getAppointmentsByUser);

/**
 * @swagger
 * /api/appointments/{id}/status:
 *   put:
 *     tags: [Appointments]
 *     summary: Update appointment status
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, confirmed, cancelled, completed]
 *               cancellationReason:
 *                 type: string
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Appointment status updated
 *       400:
 *         description: Invalid status transition
 *       404:
 *         description: Appointment not found
 */
router.put("/:id/status", updateAppointmentStatus);

export default router;


