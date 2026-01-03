import app from "./app";
import { config } from "dotenv";
import { connectMongo } from "./utils/db";

const PORT = 5555;

config();
// Connect to Mongo in background (non-blocking startup)
void connectMongo();

app.listen(PORT, () => {
	console.log(`Server running on http://localhost:${PORT}`);
});


