import { Request, Response } from "express";
import { Charity } from "../models/Charity";
import { AuthRequest } from "../utils/auth";
import Donation from "../models/Donation";

export async function createCampaign(req: AuthRequest, res: Response) {
	try {
		const userId = req.user?.id;
		if (!userId) return res.status(401).json({ message: "Unauthorized" });

		const { name, description, goal, image } = req.body;
		
		const campaign = await Charity.create({
			ownerId: userId,
			name,
			description,
			goal,
			image: image || { url: "https://placehold.co/600x400?text=No+Image" },
			raised: 0
		});

		return res.status(201).json(campaign);
	} catch (error: any) {
		return res.status(500).json({ message: error.message || "Failed to create campaign" });
	}
}

export async function getAllCampaigns(req: Request, res: Response) {
	try {
		const campaigns = await Charity.find().sort({ createdAt: -1 }).populate("ownerId", "firstName lastName email");
		return res.status(200).json(campaigns);
	} catch (error: any) {
		return res.status(500).json({ message: error.message || "Failed to fetch campaigns" });
	}
}

export async function getShelterCampaigns(req: AuthRequest, res: Response) {
	try {
		const userId = req.user?.id;
		const campaigns = await Charity.find({ ownerId: userId }).sort({ createdAt: -1 });
		return res.status(200).json(campaigns);
	} catch (error: any) {
		return res.status(500).json({ message: error.message || "Failed to fetch your campaigns" });
	}
}

export async function getCampaignById(req: Request, res: Response) {
	try {
		const campaign = await Charity.findById(req.params.id).populate("ownerId", "firstName lastName email");
		if (!campaign) return res.status(404).json({ message: "Campaign not found" });
		return res.status(200).json(campaign);
	} catch (error: any) {
		return res.status(500).json({ message: error.message || "Failed to fetch campaign" });
	}
}

export async function getShelterStats(req: AuthRequest, res: Response) {
	try {
		const userId = req.user?.id;
		
		// Find all campaigns owned by this shelter
		const campaigns = await Charity.find({ ownerId: userId });
		const campaignIds = campaigns.map(c => c._id);

		// Sum up all completed donations for these campaigns
		const donations = await Donation.aggregate([
			{ 
				$match: { 
					charityId: { $in: campaignIds },
					status: "completed"
				} 
			},
			{ 
				$group: { 
					_id: null, 
					totalRaised: { $sum: "$amount" },
					count: { $sum: 1 }
				} 
			}
		]);

		return res.status(200).json({
			totalRaised: donations[0]?.totalRaised || 0,
			donationCount: donations[0]?.count || 0,
			campaignCount: campaigns.length
		});
	} catch (error: any) {
		return res.status(500).json({ message: error.message || "Failed to fetch shelter stats" });
	}
}
