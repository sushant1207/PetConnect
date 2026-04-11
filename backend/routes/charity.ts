import { Router } from "express";
import {
	createCampaign,
	getAllCampaigns,
	getShelterCampaigns,
	getCampaignById,
	getShelterStats
} from "../controller/charityController";
import {
	initiateDonation,
	verifyDonation,
	getMyDonations
} from "../controller/donationController";
import { authenticate } from "../utils/auth";
import { campaignImageUpload } from "../middleware/uploadMiddleware";

const router = Router();

// Campaign routes
/**
 * @swagger
 * /api/charity/campaigns:
 *   get:
 *     tags: [Charity]
 *     summary: Get all public charity campaigns
 *     responses:
 *       200:
 *         description: Campaign list
 */
router.get("/campaigns", getAllCampaigns);

/**
 * @swagger
 * /api/charity/campaigns/my:
 *   get:
 *     tags: [Charity]
 *     summary: Get campaigns owned by authenticated shelter
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Shelter campaigns
 *       401:
 *         description: Unauthorized
 */
router.get("/campaigns/my", authenticate as any, getShelterCampaigns);

/**
 * @swagger
 * /api/charity/campaigns/stats:
 *   get:
 *     tags: [Charity]
 *     summary: Get campaign statistics for authenticated shelter
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Shelter campaign metrics
 *       401:
 *         description: Unauthorized
 */
router.get("/campaigns/stats", authenticate as any, getShelterStats);

/**
 * @swagger
 * /api/charity/campaigns/{id}:
 *   get:
 *     tags: [Charity]
 *     summary: Get a campaign by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Campaign details
 *       404:
 *         description: Campaign not found
 */
router.get("/campaigns/:id", getCampaignById);

/**
 * @swagger
 * /api/charity/campaigns:
 *   post:
 *     tags: [Charity]
 *     summary: Create a new campaign
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [name, description, goal]
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               goal:
 *                 type: number
 *               imageUrl:
 *                 type: string
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Campaign created
 *       401:
 *         description: Unauthorized
 */
router.post("/campaigns", authenticate as any, campaignImageUpload.single("image"), createCampaign);

// Donation routes
/**
 * @swagger
 * /api/charity/my-donations:
 *   get:
 *     tags: [Donations]
 *     summary: Get donations made by authenticated user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User donation history
 *       401:
 *         description: Unauthorized
 */
router.get("/my-donations", authenticate as any, getMyDonations);

/**
 * @swagger
 * /api/charity/donate:
 *   post:
 *     tags: [Donations]
 *     summary: Initiate campaign donation payment
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [campaignId, amount]
 *             properties:
 *               campaignId:
 *                 type: string
 *               amount:
 *                 type: number
 *     responses:
 *       200:
 *         description: Donation payment initiated
 *       401:
 *         description: Unauthorized
 */
router.post("/donate", authenticate as any, initiateDonation);

/**
 * @swagger
 * /api/charity/verify:
 *   post:
 *     tags: [Donations]
 *     summary: Verify donation payment
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Donation payment verified
 *       400:
 *         description: Payment verification failed
 */
router.post("/verify", verifyDonation);

export default router;
