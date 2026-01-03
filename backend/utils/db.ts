import mongoose from "mongoose";

let isConnected = false;

export async function connectMongo(uri?: string): Promise<void> {
	const mongoUri = uri || process.env.MONGODB_URI || process.env.MONGO_URI;
	if (!mongoUri) {
		console.warn("MONGODB_URI not set. Skipping MongoDB connection.");
		return;
	}
	if (isConnected) return;
	try {
		await mongoose.connect(mongoUri);
		isConnected = true;
		console.log("MongoDB connected");
	} catch (error) {
		console.error("MongoDB connection error:", error);
	}
}

export function getConnectionState(): "connected" | "disconnected" {
	return isConnected ? "connected" : "disconnected";
}


