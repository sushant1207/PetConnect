"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectMongo = connectMongo;
exports.getConnectionState = getConnectionState;
const mongoose_1 = __importDefault(require("mongoose"));
let isConnected = false;
async function connectMongo(uri) {
    const mongoUri = uri || process.env.MONGODB_URI || process.env.MONGO_URI;
    if (!mongoUri) {
        console.warn("MONGODB_URI not set. Skipping MongoDB connection.");
        return;
    }
    if (isConnected)
        return;
    try {
        await mongoose_1.default.connect(mongoUri);
        isConnected = true;
        console.log("MongoDB connected");
    }
    catch (error) {
        console.error("MongoDB connection error:", error);
    }
}
function getConnectionState() {
    return isConnected ? "connected" : "disconnected";
}
