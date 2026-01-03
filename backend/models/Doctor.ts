import mongoose, { Document, Schema, Model } from "mongoose";
import bcrypt from "bcryptjs";

export interface IDoctor extends Document {
	firstName: string;
	lastName: string;
	email: string;
	password: string;
	specialization: string;
	experience: number;
	bio: string;
	availability: string[];
	isActive: boolean;
	locationPreference: "clinic" | "home_visit" | "both";
	clinicAddress?: string;
	appointmentDuration: number;
	bookingFee: number;
	profileImage?: { public_id?: string; url?: string };
	comparePassword: (password: string) => Promise<boolean>;
}

const DoctorSchema = new Schema<IDoctor>(
	{
		firstName: { type: String, required: [true, "First name is required"], trim: true },
		lastName: { type: String, required: [true, "Last name is required"], trim: true },
		email: {
			type: String,
			required: [true, "Email is required"],
			unique: true,
			lowercase: true,
			trim: true,
			match: [/^\S+@\S+\.\S+$/, "Please enter a valid email address"]
		},
		password: { type: String, required: [true, "Password is required"], minlength: [6, "Password must be at least 6 characters"], select: false },
		specialization: { type: String, required: [true, "Specialization is required"] },
		experience: { type: Number, default: 0 },
		bio: { type: String, default: "" },
		availability: {
			type: [String],
			default: [],
			validate: {
				validator: function (v: string[]) {
					return v.every((entry: string) => /^[A-Z][a-z]+ \d+-\d+$/.test(entry));
				},
				message: (props: any) => `${props.value} is not a valid availability format! Expected format: "Day StartHour-EndHour"`
			}
		},
		isActive: { type: Boolean, default: true },
		locationPreference: { type: String, enum: ["clinic", "home_visit", "both"], default: "clinic" },
		clinicAddress: { type: String, default: "" },
		appointmentDuration: { type: Number, default: 30 },
		bookingFee: { type: Number, default: 500 },
		profileImage: { public_id: String, url: String }
	},
	{ timestamps: true }
);

DoctorSchema.pre<IDoctor>("save", async function (this: IDoctor) {
	if (!this.isModified("password")) return;
	try {
		const salt = await bcrypt.genSalt(10);
		this.password = await bcrypt.hash(this.password, salt);
	} catch (error: any) {
		// rethrow to surface error
		throw error;
	}
});

DoctorSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
	return bcrypt.compare(candidatePassword, this.password);
};

const Doctor: Model<IDoctor> = mongoose.model<IDoctor>("Doctor", DoctorSchema);
export default Doctor;


