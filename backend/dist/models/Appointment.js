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
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const appointmentSchema = new mongoose_1.Schema({
    user: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: [true, "User is required"] },
    doctor: { type: mongoose_1.Schema.Types.ObjectId, ref: "Doctor", required: [true, "Doctor is required"] },
    date: { type: Date, required: [true, "Appointment date is required"] },
    timeSlot: { type: String, required: [true, "Time slot is required"] },
    petName: { type: String, required: [true, "Pet name is required"], trim: true },
    petType: { type: String, required: [true, "Pet type is required"], trim: true },
    reason: { type: String, required: [true, "Reason for appointment is required"], trim: true },
    status: { type: String, enum: ["pending", "confirmed", "cancelled", "completed"], default: "pending" },
    notes: { type: String, trim: true },
    cancellationReason: { type: String, trim: true },
    locationPreference: { type: String, enum: ["clinic", "home_visit"], required: [true, "Location preference is required"] },
    address: { type: String, trim: true },
    appointmentDuration: { type: Number, default: 30, required: [true, "Appointment duration is required"] },
    payment: {
        status: { type: String, enum: ["pending", "paid", "refunded"], default: "pending" },
        amount: { type: Number, required: [true, "Payment amount is required"] },
        transactionId: String,
        method: { type: String, enum: ["cash", "card", "khalti", "esewa"] },
        paidAt: Date
    },
    createdAt: { type: Date, default: Date.now }
});
exports.default = mongoose_1.default.model("Appointment", appointmentSchema);
