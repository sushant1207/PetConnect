import mongoose, { Schema, Document } from "mongoose";
import bcrypt from "bcryptjs";

export interface IUser extends Document {
	email: string;
	password: string;
	role: string;
	createdAt: Date;
	__v: number;
	avatar?: {
		public_id?: string;
		url?: string;
		status?: string;
		address?: string;
		phone?: string;
		firstName?: string;
		lastName?: string;
		isAdmin?: boolean;
		isDoctor?: boolean;
		verified?: boolean;
	};
	status?: string;
	address?: string;
	phone?: string;
	firstName?: string;
	lastName?: string;
	isAdmin?: boolean;
	isDoctor?: boolean;
	verified?: boolean;
	googleId?: string;
	isEmailVerified?: boolean;
	emailVerificationToken?: string;
	emailVerificationExpires?: Date;
	verificationCode?: string;
	verificationCodeExpires?: Date;
	resetToken?: string;
	resetTokenExpiry?: Date;
	comparePassword: (candidatePassword: string) => Promise<boolean>;
	name: string;
	lastActive: Date;
	isOnline: boolean;
	lastAuthMethod?: string;
	uniqueSessionId?: string;
}

const UserSchema: Schema = new Schema(
	{
		email: {
			type: String,
			required: true,
			unique: true,
			validate: {
				validator: function (this: any, v: string) {
					if (this.googleId) return true;
					return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
				},
				message: "Please provide a valid email address"
			}
		},
		password: {
			type: String,
			required: function (this: any) {
				return !this.googleId;
			}
		},
		role: { type: String, enum: ["user", "admin", "doctor", "staff"], default: "user" },
		__v: { type: Number, default: 0 },
		avatar: {
			public_id: String,
			url: String,
			status: { type: String, default: "active" },
			address: { type: String, default: "" },
			phone: { type: String, default: "" },
			firstName: String,
			lastName: String,
			isAdmin: { type: Boolean, default: false },
			isDoctor: { type: Boolean, default: false },
			verified: { type: Boolean, default: false }
		},
		status: { type: String, default: "active" },
		address: { type: String, default: "" },
		phone: { type: String, default: "" },
		firstName: String,
		lastName: String,
		isAdmin: { type: Boolean, default: false },
		isDoctor: { type: Boolean, default: false },
		verified: { type: Boolean, default: false },
		googleId: { type: String, sparse: true },
		isEmailVerified: { type: Boolean, default: false },
		emailVerificationToken: { type: String, default: null },
		emailVerificationExpires: { type: Date, default: null },
		verificationCode: { type: String, default: null },
		verificationCodeExpires: { type: Date, default: null },
		resetToken: { type: String, default: null },
		resetTokenExpiry: { type: Date, default: null },
		lastActive: { type: Date, default: null },
		isOnline: { type: Boolean, default: false },
		lastAuthMethod: { type: String, enum: ["password", "google"], default: "password" },
		uniqueSessionId: { type: String, default: null }
	},
	{
		timestamps: true,
		toJSON: { virtuals: true },
		toObject: { virtuals: true },
		strict: false
	}
);

UserSchema.virtual("name").get(function (this: IUser) {
	const firstName = (this as any).firstName || this.avatar?.firstName || "";
	const lastName = (this as any).lastName || this.avatar?.lastName || "";
	return `${firstName} ${lastName}`.trim();
});

UserSchema.pre<IUser>("save", async function (this: IUser) {
	if (this.googleId && !this.password) return;
	if (!this.isModified("password")) return;
	try {
		const salt = await bcrypt.genSalt(10);
		this.password = await bcrypt.hash(this.password, salt);
	} catch (error: any) {
		throw error;
	}
});

UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
	return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model<IUser>("User", UserSchema);


