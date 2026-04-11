import { Router } from "express";
import { createReview, getReviews } from "../controller/reviewController";
import { authenticate } from "../utils/auth";

const router = Router();

/**
 * @swagger
 * /api/reviews:
 *   get:
 *     tags: [Reviews]
 *     summary: Get reviews
 *     parameters:
 *       - in: query
 *         name: doctorId
 *         schema:
 *           type: string
 *         description: Filter reviews by doctor
 *     responses:
 *       200:
 *         description: Reviews list
 */
router.get("/", getReviews);

/**
 * @swagger
 * /api/reviews:
 *   post:
 *     tags: [Reviews]
 *     summary: Create a review
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [doctorId, rating]
 *             properties:
 *               doctorId:
 *                 type: string
 *               rating:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 5
 *               comment:
 *                 type: string
 *     responses:
 *       201:
 *         description: Review created
 *       401:
 *         description: Unauthorized
 */
router.post("/", authenticate as any, createReview);

export default router;
