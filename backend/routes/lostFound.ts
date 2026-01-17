import { Router } from "express";
import {
	createReport,
	getAllReports,
	getReportById,
	updateReport,
	deleteReport,
	getMyReports
} from "../controller/lostFoundController";
import { authenticate } from "../utils/auth";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: LostFound
 *   description: Lost and Found pet reports
 */

/**
 * @swagger
 * /api/lost-found:
 *   get:
 *     tags: [LostFound]
 *     summary: Get all lost and found reports
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [lost, found]
 *       - in: query
 *         name: petType
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [open, resolved, closed]
 *       - in: query
 *         name: location
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of reports
 *       500:
 *         description: Server error
 */
router.get("/", getAllReports);

/**
 * @swagger
 * /api/lost-found/my-reports:
 *   get:
 *     tags: [LostFound]
 *     summary: Get reports created by the current user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user's reports
 *       401:
 *         description: Unauthorized
 */
router.get("/my-reports", authenticate as any, getMyReports);

/**
 * @swagger
 * /api/lost-found/{id}:
 *   get:
 *     tags: [LostFound]
 *     summary: Get a report by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Report details
 *       404:
 *         description: Report not found
 */
router.get("/:id", getReportById);

/**
 * @swagger
 * /api/lost-found:
 *   post:
 *     tags: [LostFound]
 *     summary: Create a new report
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [type, petType, location, date, description, contact]
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [lost, found]
 *               petType:
 *                 type: string
 *               location:
 *                 type: string
 *               date:
 *                 type: string
 *               description:
 *                 type: string
 *               contact:
 *                 type: object
 *                 required: [name, email]
 *                 properties:
 *                   name: { type: string }
 *                   email: { type: string }
 *                   phone: { type: string }
 *     responses:
 *       201:
 *         description: Report created
 *       401:
 *         description: Unauthorized
 */
router.post("/", authenticate as any, createReport);

/**
 * @swagger
 * /api/lost-found/{id}:
 *   put:
 *     tags: [LostFound]
 *     summary: Update a report
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Report updated
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Report not found
 */
router.put("/:id", authenticate as any, updateReport);

/**
 * @swagger
 * /api/lost-found/{id}:
 *   delete:
 *     tags: [LostFound]
 *     summary: Delete a report
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Report deleted
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Report not found
 */
router.delete("/:id", authenticate as any, deleteReport);

export default router;
