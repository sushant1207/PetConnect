import { Request, Response } from "express";
import Review from "../models/Review";
import { AuthRequest } from "../utils/auth";

export async function createReview(req: AuthRequest, res: Response) {
	try {
		const userId = req.user?.id;
		const { targetId, targetModel, rating, comment } = req.body;

		if (!userId) return res.status(401).json({ message: "Unauthorized" });
		if (!targetId || !targetModel || !rating) {
			return res.status(400).json({ message: "Missing required fields" });
		}

		if (rating < 1 || rating > 5) {
			return res.status(400).json({ message: "Rating must be between 1 and 5" });
		}

		const existing = await Review.findOne({ reviewer: userId, targetId, targetModel });
		if (existing) {
			return res.status(409).json({ message: "You have already reviewed this item" });
		}

		const review = await Review.create({
			reviewer: userId,
			targetId,
			targetModel,
			rating,
			comment
		});

		return res.status(201).json({ message: "Review submitted", review });
	} catch (error: any) {
		return res.status(500).json({ message: error.message || "Failed to submit review" });
	}
}

export async function getReviews(req: Request, res: Response) {
	try {
		const { targetId, targetModel } = req.query;
		if (!targetId || !targetModel) {
			return res.status(400).json({ message: "targetId and targetModel are required" });
		}

		const reviews = await Review.find({ targetId, targetModel }).populate("reviewer", "firstName lastName");
		
		const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
		const averageRating = reviews.length > 0 ? (totalRating / reviews.length).toFixed(1) : 0;

		return res.json({
			count: reviews.length,
			averageRating: Number(averageRating),
			reviews
		});
	} catch (error: any) {
		return res.status(500).json({ message: "Failed to fetch reviews" });
	}
}
