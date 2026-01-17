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

const router = Router();

// Campaign routes
router.get("/campaigns", getAllCampaigns);
router.get("/campaigns/my", authenticate as any, getShelterCampaigns);
router.get("/campaigns/stats", authenticate as any, getShelterStats);
router.get("/campaigns/:id", getCampaignById);
router.post("/campaigns", authenticate as any, createCampaign);

// Donation routes
router.get("/my-donations", authenticate as any, getMyDonations);
router.post("/donate", authenticate as any, initiateDonation);
router.post("/verify", verifyDonation);

export default router;
