import mongoose, { Document, Schema } from "mongoose";

export interface IReview extends Document {
	reviewer: mongoose.Types.ObjectId;
	targetId: mongoose.Types.ObjectId;
	targetModel: "Doctor" | "Product";
	rating: number;
	comment: string;
	createdAt: Date;
}

const ReviewSchema = new Schema<IReview>(
	{
		reviewer: { type: Schema.Types.ObjectId, ref: "User", required: true },
		targetId: { type: Schema.Types.ObjectId, required: true },
		targetModel: { type: String, enum: ["Doctor", "Product"], required: true },
		rating: { type: Number, required: true, min: 1, max: 5 },
		comment: { type: String, trim: true },
	},
	{ timestamps: true }
);

// Prevent user from reviewing the same target twice
ReviewSchema.index({ reviewer: 1, targetId: 1, targetModel: 1 }, { unique: true });

export default mongoose.model<IReview>("Review", ReviewSchema);
