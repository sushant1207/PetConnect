"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Message = exports.Chat = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const messageSchema = new mongoose_1.default.Schema({
    sender: { type: mongoose_1.default.Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    status: { type: String, enum: ["sent", "delivered", "read"], default: "sent" }
});
const chatSchema = new mongoose_1.default.Schema({
    participants: [{ type: mongoose_1.default.Schema.Types.ObjectId, ref: "User" }],
    messages: [messageSchema],
    lastMessage: { type: Date, default: Date.now },
    isActive: { type: Boolean, default: true },
    reportId: { type: mongoose_1.default.Schema.Types.ObjectId, ref: "LostFound", default: null }
}, { timestamps: true });
exports.Chat = mongoose_1.default.model("Chat", chatSchema);
exports.Message = mongoose_1.default.model("Message", messageSchema);
