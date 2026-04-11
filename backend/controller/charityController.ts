import { Request, Response } from "express";
import { Charity } from "../models/Charity";
import { AuthRequest } from "../utils/auth";
import Donation from "../models/Donation";

export async function createCampaign(req: AuthRequest, res: Response) {
	try {
		const userId = req.user?.id;
		if (!userId) return res.status(401).json({ message: "Unauthorized" });

		const { name, description, goal, imageUrl } = req.body;
		const parsedGoal = Number(goal);

		if (!name || !description || Number.isNaN(parsedGoal)) {
			return res.status(400).json({ message: "name, description, and valid goal are required" });
		}

		const uploadedFile = req.file as Express.Multer.File | undefined;
		const image = uploadedFile
			? {
				public_id: uploadedFile.filename,
				url: `/uploads/campaigns/${uploadedFile.filename}`
			}
			: imageUrl
				? { public_id: "campaign_url", url: String(imageUrl) }
				: { public_id: "campaign_placeholder", url: "https://placehold.co/600x400?text=No+Image" };
		
		const campaign = await Charity.create({
			ownerId: userId,
			name,
			description,
			goal: parsedGoal,
			image,
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
		const totals = await Donation.aggregate([
			{ $match: { status: "completed" } },
			{ $group: { _id: "$charityId", total: { $sum: "$amount" } } }
		]);
		const totalsMap = new Map(totals.map((t: any) => [String(t._id), Number(t.total || 0)]));

		const normalized = campaigns.map((campaign: any) => {
			const total = totalsMap.get(String(campaign._id)) || 0;
			const obj = campaign.toObject ? campaign.toObject() : campaign;
			obj.raised = total;
			return obj;
		});

		return res.status(200).json(normalized);
	} catch (error: any) {
		return res.status(500).json({ message: error.message || "Failed to fetch campaigns" });
	}
}

export async function getShelterCampaigns(req: AuthRequest, res: Response) {
	try {
		const userId = req.user?.id;
		const campaigns = await Charity.find({ ownerId: userId }).sort({ createdAt: -1 });
		const totals = await Donation.aggregate([
			{ $match: { status: "completed", charityId: { $in: campaigns.map((c) => c._id) } } },
			{ $group: { _id: "$charityId", total: { $sum: "$amount" } } }
		]);
		const totalsMap = new Map(totals.map((t: any) => [String(t._id), Number(t.total || 0)]));
		const normalized = campaigns.map((campaign: any) => {
			const obj = campaign.toObject ? campaign.toObject() : campaign;
			obj.raised = totalsMap.get(String(campaign._id)) || 0;
			return obj;
		});
		return res.status(200).json(normalized);
	} catch (error: any) {
		return res.status(500).json({ message: error.message || "Failed to fetch your campaigns" });
	}
}

export async function getCampaignById(req: Request, res: Response) {
	try {
		const campaign = await Charity.findById(req.params.id).populate("ownerId", "firstName lastName email");
		if (!campaign) return res.status(404).json({ message: "Campaign not found" });

		const totals = await Donation.aggregate([
			{ $match: { status: "completed", charityId: campaign._id } },
			{ $group: { _id: "$charityId", total: { $sum: "$amount" } } }
		]);
		const totalRaised = Number(totals[0]?.total || 0);
		const normalized = campaign.toObject ? campaign.toObject() : campaign;
		normalized.raised = totalRaised;

		return res.status(200).json(normalized);
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
