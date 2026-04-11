import mongoose, { Document, Schema, Model } from "mongoose";

export interface IReport extends Document {
	reporter: mongoose.Types.ObjectId;
	targetId: mongoose.Types.ObjectId;
	targetModel: "LostFound" | "User" | "Product";
	reason: string;
	status: "pending" | "reviewed" | "resolved" | "dismissed";
	adminNotes?: string;
	createdAt: Date;
	updatedAt: Date;
}

const ReportSchema = new Schema<IReport>(
	{
		reporter: { type: Schema.Types.ObjectId, ref: "User", required: true },
		targetId: { type: Schema.Types.ObjectId, required: true },
		targetModel: { type: String, enum: ["LostFound", "User", "Product"], required: true },
		reason: { type: String, required: [true, "Report reason is required"], trim: true },
		status: { type: String, enum: ["pending", "reviewed", "resolved", "dismissed"], default: "pending" },
		adminNotes: { type: String, trim: true }
	},
	{ timestamps: true }
);

export default mongoose.model<IReport>("Report", ReportSchema);
