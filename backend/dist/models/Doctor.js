"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const DoctorSchema = new mongoose_1.Schema({
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
            validator: function (v) {
                return v.every((entry) => /^[A-Z][a-z]+ \d+-\d+$/.test(entry));
            },
            message: (props) => `${props.value} is not a valid availability format! Expected format: "Day StartHour-EndHour"`
        }
    },
    isActive: { type: Boolean, default: true },
    locationPreference: { type: String, enum: ["clinic", "home_visit", "both"], default: "clinic" },
    clinicAddress: { type: String, default: "" },
    appointmentDuration: { type: Number, default: 30 },
    bookingFee: { type: Number, default: 500 },
    profileImage: { public_id: String, url: String }
}, { timestamps: true });
DoctorSchema.pre("save", async function () {
    if (!this.isModified("password"))
        return;
    try {
        const salt = await bcryptjs_1.default.genSalt(10);
        this.password = await bcryptjs_1.default.hash(this.password, salt);
    }
    catch (error) {
        // rethrow to surface error
        throw error;
    }
});
DoctorSchema.methods.comparePassword = async function (candidatePassword) {
    return bcryptjs_1.default.compare(candidatePassword, this.password);
};
const Doctor = mongoose_1.default.model("Doctor", DoctorSchema);
exports.default = Doctor;
