import { Request, Response } from "express";
import LostFound from "../models/LostFound";
import { AuthRequest } from "../utils/auth";

export async function createReport(req: AuthRequest, res: Response) {
	try {
		const userId = req.user?.id;
		if (!userId) {
			return res.status(401).json({ message: "Unauthorized" });
		}

		const reportData = {
			...req.body,
			userId,
		};

		const report = await LostFound.create(reportData);
		return res.status(201).json(report);
	} catch (error: any) {
		return res.status(500).json({ message: error.message || "Failed to create report" });
	}
}

export async function getAllReports(req: Request, res: Response) {
	try {
		const { type, petType, status, location } = req.query;
		const query: any = {};

		if (type) query.type = type;
		if (petType) query.petType = petType;
		if (status) query.status = status;
		if (location) query.location = { $regex: location, $options: "i" };

		const reports = await LostFound.find(query).sort({ createdAt: -1 }).populate("userId", "firstName lastName email");
		return res.status(200).json(reports);
	} catch (error: any) {
		return res.status(500).json({ message: error.message || "Failed to fetch reports" });
	}
}

export async function getReportById(req: Request, res: Response) {
	try {
		const report = await LostFound.findById(req.params.id).populate("userId", "firstName lastName email");
		if (!report) {
			return res.status(404).json({ message: "Report not found" });
		}
		return res.status(200).json(report);
	} catch (error: any) {
		return res.status(500).json({ message: error.message || "Failed to fetch report" });
	}
}

export async function updateReport(req: AuthRequest, res: Response) {
	try {
		const userId = req.user?.id;
		const report = await LostFound.findById(req.params.id);

		if (!report) {
			return res.status(404).json({ message: "Report not found" });
		}

		if (report.userId.toString() !== userId && req.user?.role !== "admin") {
			return res.status(403).json({ message: "Not authorized to update this report" });
		}

		const updatedReport = await LostFound.findByIdAndUpdate(req.params.id, req.body, { new: true });
		return res.status(200).json(updatedReport);
	} catch (error: any) {
		return res.status(500).json({ message: error.message || "Failed to update report" });
	}
}

export async function deleteReport(req: AuthRequest, res: Response) {
	try {
		const userId = req.user?.id;
		const report = await LostFound.findById(req.params.id);

		if (!report) {
			return res.status(404).json({ message: "Report not found" });
		}

		if (report.userId.toString() !== userId && req.user?.role !== "admin") {
			return res.status(403).json({ message: "Not authorized to delete this report" });
		}

		await LostFound.findByIdAndDelete(req.params.id);
		return res.status(200).json({ message: "Report deleted successfully" });
	} catch (error: any) {
		return res.status(500).json({ message: error.message || "Failed to delete report" });
	}
}

export async function getMyReports(req: AuthRequest, res: Response) {
	try {
		const userId = req.user?.id;
		const reports = await LostFound.find({ userId }).sort({ createdAt: -1 });
		return res.status(200).json(reports);
	} catch (error: any) {
		return res.status(500).json({ message: error.message || "Failed to fetch your reports" });
	}
}
