import { Request, Response } from "express";
import Donation from "../models/Donation";
import { Charity } from "../models/Charity";
import { AuthRequest } from "../utils/auth";
import crypto from "crypto";

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

		// For eSewa, in a real app we'd generate the signed message here
		// For this demo, we'll return the donation ID as the product code
		
		return res.status(201).json({
			message: "Donation initiated",
			donationId: donation._id,
			// Simulated eSewa form data
			esewaData: {
				amount: amount,
				tax_amount: 0,
				total_amount: amount,
				transaction_uuid: donation._id,
				product_code: "EPAYTEST",
				product_service_charge: 0,
				product_delivery_charge: 0,
				success_url: `http://localhost:3000/dashboard/donations/success?donationId=${donation._id}`,
				failure_url: `http://localhost:3000/dashboard/donations/failure?donationId=${donation._id}`,
				signed_field_names: "total_amount,transaction_uuid,product_code",
				// Mock signature for demo purposes
				signature: "mock_signature"
			}
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
