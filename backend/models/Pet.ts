import mongoose, { Schema, Document } from "mongoose";

export interface IPet extends Document {
	ownerId: mongoose.Types.ObjectId;
	petId: string; // Unique pet ID for QR code
	name: string;
	species: "dog" | "cat" | "bird" | "rabbit" | "other";
	breed?: string;
	age?: number;
	gender?: "male" | "female" | "unknown";
	color?: string;
	microchipped?: boolean;
	vaccinations?: Array<{ name: string; date: Date }>;
	notes?: string;
	createdAt: Date;
	updatedAt: Date;
}

const petSchema = new Schema<IPet>(
	{
		ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
		petId: { type: String, unique: true, sparse: true, index: true },
		name: { type: String, required: true, trim: true },
		species: { type: String, enum: ["dog", "cat", "bird", "rabbit", "other"], required: true },
		breed: String,
		age: Number,
		gender: { type: String, enum: ["male", "female", "unknown"] },
		color: String,
		microchipped: { type: Boolean, default: false },
		vaccinations: [{ name: String, date: Date }],
		notes: String
	},
	{ timestamps: true }
);

export default mongoose.model<IPet>("Pet", petSchema);


