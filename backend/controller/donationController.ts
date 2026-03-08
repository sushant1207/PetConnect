import { Request, Response } from "express";
import Donation from "../models/Donation";
import { Charity } from "../models/Charity";
import { AuthRequest } from "../utils/auth";
import { buildEsewaFormData } from "../utils/esewa";

export async function initiateDonation(req: AuthRequest, res: Response) {
	try {
		const userId = req.user?.id;
		if (!userId) return res.status(401).json({ message: "Unauthorized" });

		const { charityId, amount, paymentMethod } = req.body;

		const charity = await Charity.findById(charityId);
		if (!charity) return res.status(404).json({ message: "Campaign not found" });

		const donation = await Donation.create({
			userId,
			userName: req.body.userName || "Anonymous",
			charityId,
			charityName: charity.name,
			amount,
			status: "pending",
			paymentMethod: paymentMethod || "esewa"
		});

		const esewaData = buildEsewaFormData({
			amount: Number(amount),
			transactionUuid: String(donation._id),
			successPath: `/dashboard/donations/success?donationId=${donation._id}`,
			failurePath: `/dashboard/donations/failure?donationId=${donation._id}`,
		});

		return res.status(201).json({
			message: "Donation initiated",
			donationId: donation._id,
			esewaData,
		});
	} catch (error: any) {
		return res.status(500).json({ message: error.message || "Failed to initiate donation" });
	}
}

export async function verifyDonation(req: Request, res: Response) {
	try {
		const { donationId, status } = req.body;
		
		const donation = await Donation.findById(donationId);
		if (!donation) return res.status(404).json({ message: "Donation not found" });

		if (status === "success") {
			donation.status = "completed";
			await donation.save();

			// Update charity raised amount
			const charity = await Charity.findById(donation.charityId);
			if (charity) {
				await (charity as any).refreshRaisedAmount();
			}
		} else {
			donation.status = "failed";
			await donation.save();
		}

		return res.status(200).json(donation);
	} catch (error: any) {
		return res.status(500).json({ message: error.message || "Failed to verify donation" });
	}
}

export async function getMyDonations(req: AuthRequest, res: Response) {
	try {
		const userId = req.user?.id;
		const donations = await Donation.find({ userId }).sort({ createdAt: -1 });
		return res.status(200).json(donations);
	} catch (error: any) {
		return res.status(500).json({ message: error.message || "Failed to fetch your donations" });
	}
}
