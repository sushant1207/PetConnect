"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const dotenv_1 = require("dotenv");
const db_1 = require("./utils/db");
const appointmentController_1 = require("./controller/appointmentController");
const PORT = 5555;
(0, dotenv_1.config)();
// Connect to Mongo in background (non-blocking startup)
void (0, db_1.connectMongo)();
app_1.default.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
// Run reminder check on startup and then every 5 minutes.
void (0, appointmentController_1.processDueAppointmentReminders)();
setInterval(() => {
    void (0, appointmentController_1.processDueAppointmentReminders)();
}, 5 * 60 * 1000);
