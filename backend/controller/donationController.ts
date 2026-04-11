import { Request, Response } from "express";
import Donation from "../models/Donation";
import { Charity } from "../models/Charity";
import { AuthRequest } from "../utils/auth";
import { buildEsewaFormData } from "../utils/esewa";

function decodeEsewaPayload(data: string): { transactionUuid?: string; status?: string } {
	try {
		const normalized = data
			.trim()
			.replace(/\s/g, "+")
			.replace(/-/g, "+")
			.replace(/_/g, "/");
		const padLength = (4 - (normalized.length % 4)) % 4;
		const padded = normalized + "=".repeat(padLength);
		const decoded = JSON.parse(Buffer.from(padded, "base64").toString("utf8"));
		return {
			transactionUuid: decoded.transaction_uuid || decoded.transactionUuid,
			status: decoded.status,
		};
	} catch {
		return {};
	}
}

export async function initiateDonation(req: AuthRequest, res: Response) {
	try {
		const userId = req.user?.id;
		if (!userId) return res.status(401).json({ message: "Unauthorized" });

		const charityId = req.body.charityId || req.body.campaignId;
		const { amount, paymentMethod } = req.body;

		if (!charityId || !amount) {
			return res.status(400).json({ message: "charityId (or campaignId) and amount are required" });
		}

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
		const { donationId, status, transactionUuid, transaction_uuid, data } = req.body;
		const decodedPayload = typeof data === "string" ? decodeEsewaPayload(data) : {};
		const resolvedDonationId = donationId || transactionUuid || transaction_uuid || decodedPayload.transactionUuid;
		if (!resolvedDonationId) {
			return res.status(400).json({ message: "donationId or transactionUuid is required" });
		}
		
		const donation = await Donation.findById(resolvedDonationId);
		if (!donation) return res.status(404).json({ message: "Donation not found" });
		let updatedCharity: any = null;
		const normalized = String(status || decodedPayload.status || "").toLowerCase();
		const isSuccess = ["success", "complete", "completed", "paid"].includes(normalized);

		if (isSuccess) {
			const wasCompleted = donation.status === "completed";
			donation.status = "completed";
			await donation.save();

			// Update charity raised amount only when moving to completed for the first time.
			if (!wasCompleted) {
				const charity = await Charity.findById(donation.charityId);
				if (charity) {
					await (charity as any).refreshRaisedAmount();
					updatedCharity = charity;
				}
			} else {
				updatedCharity = await Charity.findById(donation.charityId);
			}
		} else {
			donation.status = "failed";
			await donation.save();
			updatedCharity = await Charity.findById(donation.charityId);
		}

		return res.status(200).json({ donation, charity: updatedCharity });
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
