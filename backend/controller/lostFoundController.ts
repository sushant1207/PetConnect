import { Request, Response } from "express";
import LostFound from "../models/LostFound";
import Report from "../models/Report";
import { AuthRequest } from "../utils/auth";
import User from "../models/User";
import { sendEmail } from "../utils/mailer";

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

		const previousStatus = report.status;
		const nextStatus = req.body?.status;

		const updatedReport = await LostFound.findByIdAndUpdate(req.params.id, req.body, { new: true });

		if (
			updatedReport &&
			nextStatus === "resolved" &&
			previousStatus !== "resolved"
		) {
			const owner = await User.findById(report.userId).select("email firstName lastName");
			const recipients = new Set<string>();

			if (owner?.email) recipients.add(owner.email);
			if (report.contact?.email) recipients.add(report.contact.email);

			const subject = "Found Alert - PetConnect";
			const html = `
				<h3>Found Alert</h3>
				<p>The report for your ${report.petType} has been marked as <strong>Found/Resolved</strong>.</p>
				<ul>
					<li><strong>Type:</strong> ${report.type}</li>
					<li><strong>Pet:</strong> ${report.petType}${report.breed ? ` (${report.breed})` : ""}</li>
					<li><strong>Location:</strong> ${report.location}</li>
					<li><strong>Date Reported:</strong> ${report.date}</li>
				</ul>
				<p>If this was updated by mistake, please review the report status in your dashboard.</p>
				<p>PetConnect Team</p>
			`;

			await Promise.allSettled(Array.from(recipients).map((email) => sendEmail(email, subject, html)));
		}

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

export async function flagPost(req: AuthRequest, res: Response) {
	try {
		const userId = req.user?.id;
		const { id } = req.params;
		const { reason } = req.body;

		if (!userId) return res.status(401).json({ message: "Unauthorized" });
		if (!reason) return res.status(400).json({ message: "Reason is required to report a post" });

		const post = await LostFound.findById(id);
		if (!post) return res.status(404).json({ message: "Post not found" });

		const existingReport = await Report.findOne({ reporter: userId, targetId: id });
		if (existingReport) {
			return res.status(400).json({ message: "You have already reported this post" });
		}

		const report = await Report.create({
			reporter: userId,
			targetId: id,
			targetModel: "LostFound",
			reason
		});

		return res.status(201).json({ message: "Post has been flagged for moderation", report });
	} catch (error: any) {
		return res.status(500).json({ message: error.message || "Failed to flag post" });
	}
}
