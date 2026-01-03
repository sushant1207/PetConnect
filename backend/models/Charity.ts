import mongoose, { Document, Schema, Model } from "mongoose";

export interface ICharity extends Document {
	name: string;
	description: string;
	goal: number;
	raised: number;
	updatedAt: Date;
	image?: {
		public_id: string;
		url: string;
	};
	refreshRaisedAmount: () => Promise<number>;
}

const charitySchema = new Schema({
	name: { type: String, required: [true, "Charity name is required"], trim: true },
	description: { type: String, required: [true, "Charity description is required"], trim: true },
	image: {
		public_id: String,
		url: String
	},
	goal: { type: Number, required: [true, "Charity goal amount is required"], min: [0, "Goal amount cannot be negative"] },
	raised: { type: Number, default: 0, min: [0, "Raised amount cannot be negative"] },
	updatedAt: { type: Date, default: Date.now }
});

charitySchema.pre("save", function (this: any) {
	if (this.raised > this.goal) {
		this.raised = this.goal;
	}
});

charitySchema.methods.refreshRaisedAmount = async function (this: ICharity) {
	try {
		const Donation = mongoose.model("Donation");
		const totalRaised = await (Donation as any).aggregate([
			{ $match: { charityId: this._id, status: "completed" } },
			{ $group: { _id: null, total: { $sum: "$amount" } } }
		]);
		this.raised = totalRaised[0]?.total || 0;
		await this.save();
		return this.raised;
	} catch (_error) {
		return this.raised;
	}
};

export const Charity: Model<ICharity> = mongoose.model<ICharity>("Charity", charitySchema);

export const initialCharities = [
	{
		name: "Nepal Animal Shelter",
		description: "Supporting stray animals with food, shelter, and medical care. Your donation helps us provide essential care for abandoned pets.",
		image: { public_id: "charity_placeholder", url: "https://placehold.co/300x300" },
		goal: 50000,
		raised: 0
	},
	{
		name: "Street Dog Welfare",
		description: "Providing vaccinations and medical treatment for street dogs. Help us create a healthier environment for street animals.",
		image: { public_id: "charity_placeholder", url: "https://placehold.co/300x300" },
		goal: 25000,
		raised: 0
	},
	{
		name: "Cat Shelter",
		description: "Meoww!",
		image: { public_id: "charity_placeholder", url: "https://placehold.co/300x300" },
		goal: 20000,
		raised: 0
	}
];


