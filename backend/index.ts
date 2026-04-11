import app from "./app";
import { config } from "dotenv";
import { connectMongo } from "./utils/db";
import { processDueAppointmentReminders } from "./controller/appointmentController";

const PORT = 5555;

config();
// Connect to Mongo in background (non-blocking startup)
void connectMongo();

app.listen(PORT, () => {
	console.log(`Server running on http://localhost:${PORT}`);
});

// Run reminder check on startup and then every 5 minutes.
void processDueAppointmentReminders();
setInterval(() => {
	void processDueAppointmentReminders();
}, 5 * 60 * 1000);


