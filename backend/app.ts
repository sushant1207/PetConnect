import express from "express";
import swaggerUi from "swagger-ui-express";
import swaggerJSDoc from "swagger-jsdoc";
import appointmentRoutes from "./routes/appointments";
import authRoutes from "./routes/auth";
import petRoutes from "./routes/pets";
import doctorRoutes from "./routes/doctors";
import lostFoundRoutes from "./routes/lostFound";
import charityRoutes from "./routes/charity";

/**
 * @swagger
 * components:
 *   schemas:
 *     HealthResponse:
 *       type: object
 *       properties:
 *         status:
 *           type: string
 *           example: ok
 *     AvailabilityResponse:
 *       type: object
 *       properties:
 *         date:
 *           type: string
 *           example: 2026-01-15
 *         slots:
 *           type: array
 *           items:
 *             type: string
 *           example: ["09:00-09:30", "09:30-10:00"]
 *     AppointmentPayment:
 *       type: object
 *       properties:
 *         status:
 *           type: string
 *           enum: [pending, paid, refunded]
 *         amount:
 *           type: number
 *         transactionId:
 *           type: string
 *         method:
 *           type: string
 *           enum: [cash, card, khalti, esewa]
 *         paidAt:
 *           type: string
 *           format: date-time
 *     Appointment:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         user:
 *           type: string
 *         doctor:
 *           type: string
 *         date:
 *           type: string
 *           format: date-time
 *         timeSlot:
 *           type: string
 *           example: "09:00-09:30"
 *         petName:
 *           type: string
 *         petType:
 *           type: string
 *         reason:
 *           type: string
 *         status:
 *           type: string
 *           enum: [pending, confirmed, cancelled, completed]
 *         notes:
 *           type: string
 *         cancellationReason:
 *           type: string
 *         locationPreference:
 *           type: string
 *           enum: [clinic, home_visit]
 *         address:
 *           type: string
 *         appointmentDuration:
 *           type: number
 *         payment:
 *           $ref: '#/components/schemas/AppointmentPayment'
 *     AppointmentCreateRequest:
 *       type: object
 *       required: [user, doctor, date, timeSlot, petName, petType, reason, locationPreference]
 *       properties:
 *         user:
 *           type: string
 *         doctor:
 *           type: string
 *         date:
 *           type: string
 *           example: "2026-01-15"
 *         timeSlot:
 *           type: string
 *           example: "09:00-09:30"
 *         petName:
 *           type: string
 *         petType:
 *           type: string
 *         reason:
 *           type: string
 *         locationPreference:
 *           type: string
 *           enum: [clinic, home_visit]
 *         address:
 *           type: string
 *         notes:
 *           type: string
 *     UserPublic:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         email:
 *           type: string
 *         role:
 *           type: string
 *           enum: [user, doctor, staff, admin]
 *         firstName:
 *           type: string
 *         lastName:
 *           type: string
 *     AuthResponse:
 *       type: object
 *       properties:
 *         user:
 *           $ref: '#/components/schemas/UserPublic'
 *         token:
 *           type: string
 *     AuthSignupRequest:
 *       type: object
 *       required: [email, password]
 *       properties:
 *         email:
 *           type: string
 *         password:
 *           type: string
 *         role:
 *           type: string
 *           enum: [user, doctor, staff, admin]
 *         firstName:
 *           type: string
 *         lastName:
 *           type: string
 *     AuthLoginRequest:
 *       type: object
 *       required: [email, password]
 *       properties:
 *         email:
 *           type: string
 *         password:
 *           type: string
 */
const app = express();

// CORS middleware
app.use((req, res, next) => {
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
	if (req.method === "OPTIONS") {
		return res.sendStatus(200);
	}
	next();
});

// Global middleware
app.use(express.json());

/**
 * @swagger
 * /:
 *   get:
 *     tags: [System]
 *     summary: Root status
 *     responses:
 *       200:
 *         description: API is running
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: API is running
 */
// Root route
app.get("/", (_req, res) => {
	res.status(200).send("API is running");
});

/**
 * @swagger
 * /health:
 *   get:
 *     tags: [System]
 *     summary: Health check
 *     responses:
 *       200:
 *         description: Service health status
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HealthResponse'
 */
// Health check
app.get("/health", (_req, res) => {
	res.status(200).json({ status: "ok" });
});

// Routes
app.use("/api/appointments", appointmentRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/pets", petRoutes);
app.use("/api/doctors", doctorRoutes);
app.use("/api/lost-found", lostFoundRoutes);
app.use("/api/charity", charityRoutes);

// Swagger setup
const swaggerSpec = swaggerJSDoc({
	definition: {
		openapi: "3.0.0",
		info: {
			title: "PetConnect API",
			version: "1.0.0"
		},
		servers: [
			{ url: "http://localhost:5555", description: "Local server" }
		]
	},
	apis: ["./routes/**/*.ts", "./controller/**/*.ts", "./app.ts"]
});

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

export default app;


