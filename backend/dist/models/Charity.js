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
exports.initialCharities = exports.Charity = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const charitySchema = new mongoose_1.Schema({
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
charitySchema.pre("save", function () {
    if (this.raised > this.goal) {
        this.raised = this.goal;
    }
});
charitySchema.methods.refreshRaisedAmount = async function () {
    try {
        const Donation = mongoose_1.default.model("Donation");
        const totalRaised = await Donation.aggregate([
            { $match: { charityId: this._id, status: "completed" } },
            { $group: { _id: null, total: { $sum: "$amount" } } }
        ]);
        this.raised = totalRaised[0]?.total || 0;
        await this.save();
        return this.raised;
    }
    catch (_error) {
        return this.raised;
    }
};
exports.Charity = mongoose_1.default.model("Charity", charitySchema);
exports.initialCharities = [
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
