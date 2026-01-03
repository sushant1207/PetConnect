"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDayOfWeek = getDayOfWeek;
exports.parseAvailabilityEntry = parseAvailabilityEntry;
exports.generateSlotsForDay = generateSlotsForDay;
exports.slotOverlaps = slotOverlaps;
const date_fns_1 = require("date-fns");
function getDayOfWeek(date) {
    return ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][date.getDay()];
}
// Parses availability entries like "Monday 9-17" -> { day: "Monday", startHour: 9, endHour: 17 }
function parseAvailabilityEntry(entry) {
    const match = entry.match(/^([A-Z][a-z]+)\s+(\d+)-(\d+)$/);
    if (!match)
        return null;
    const [, day, start, end] = match;
    return { day: day, startHour: Number(start), endHour: Number(end) };
}
function generateSlotsForDay(date, startHour, endHour, durationMinutes) {
    const start = (0, date_fns_1.set)(date, { hours: startHour, minutes: 0, seconds: 0, milliseconds: 0 });
    const end = (0, date_fns_1.set)(date, { hours: endHour, minutes: 0, seconds: 0, milliseconds: 0 });
    const slots = [];
    let cursor = start;
    while ((0, date_fns_1.isBefore)(cursor, end)) {
        const slotEnd = (0, date_fns_1.addMinutes)(cursor, durationMinutes);
        if ((0, date_fns_1.isBefore)(slotEnd, end) || (0, date_fns_1.isEqual)(slotEnd, end)) {
            const label = `${(0, date_fns_1.format)(cursor, "HH:mm")}-${(0, date_fns_1.format)(slotEnd, "HH:mm")}`;
            slots.push(label);
        }
        cursor = slotEnd;
    }
    return slots;
}
function slotOverlaps(a, b) {
    const [aStartStr, aEndStr] = a.split("-");
    const [bStartStr, bEndStr] = b.split("-");
    const base = new Date();
    const aStart = (0, date_fns_1.parse)(aStartStr, "HH:mm", base);
    const aEnd = (0, date_fns_1.parse)(aEndStr, "HH:mm", base);
    const bStart = (0, date_fns_1.parse)(bStartStr, "HH:mm", base);
    const bEnd = (0, date_fns_1.parse)(bEndStr, "HH:mm", base);
    return aStart < bEnd && bStart < aEnd;
}
