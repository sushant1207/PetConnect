import { addMinutes, format, isBefore, isEqual, parse, set } from "date-fns";

export type DayOfWeek =
	| "Sunday"
	| "Monday"
	| "Tuesday"
	| "Wednesday"
	| "Thursday"
	| "Friday"
	| "Saturday";

export function getDayOfWeek(date: Date): DayOfWeek {
	return ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][date.getDay()] as DayOfWeek;
}

// Parses availability entries like "Monday 9-17" -> { day: "Monday", startHour: 9, endHour: 17 }
export function parseAvailabilityEntry(entry: string): { day: DayOfWeek; startHour: number; endHour: number } | null {
	const match = entry.match(/^([A-Z][a-z]+)\s+(\d+)-(\d+)$/);
	if (!match) return null;
	const [, day, start, end] = match;
	return { day: day as DayOfWeek, startHour: Number(start), endHour: Number(end) };
}

export function generateSlotsForDay(date: Date, startHour: number, endHour: number, durationMinutes: number): string[] {
	const start = set(date, { hours: startHour, minutes: 0, seconds: 0, milliseconds: 0 });
	const end = set(date, { hours: endHour, minutes: 0, seconds: 0, milliseconds: 0 });
	const slots: string[] = [];
	let cursor = start;
	while (isBefore(cursor, end)) {
		const slotEnd = addMinutes(cursor, durationMinutes);
		if (isBefore(slotEnd, end) || isEqual(slotEnd, end)) {
			const label = `${format(cursor, "HH:mm")}-${format(slotEnd, "HH:mm")}`;
			slots.push(label);
		}
		cursor = slotEnd;
	}
	return slots;
}

export function slotOverlaps(a: string, b: string): boolean {
	const [aStartStr, aEndStr] = a.split("-");
	const [bStartStr, bEndStr] = b.split("-");
	const base = new Date();
	const aStart = parse(aStartStr, "HH:mm", base);
	const aEnd = parse(aEndStr, "HH:mm", base);
	const bStart = parse(bStartStr, "HH:mm", base);
	const bEnd = parse(bEndStr, "HH:mm", base);
	return aStart < bEnd && bStart < aEnd;
}


