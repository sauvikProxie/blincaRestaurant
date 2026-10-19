/**
 * Stockholm wall-clock helpers, ported from the backend's
 * convex/lib/stockholmTime.ts so this app reads opening hours and business
 * days exactly the way the backend enforces them. Keep the two in sync.
 */
import type { HoursRange, OpeningHours } from '$lib/types';

export const STOCKHOLM_TZ = 'Europe/Stockholm';

/** The business day starts at 04:00 so late-night service counts as one day. */
export const BUSINESS_DAY_START_HOUR = 4;

export interface StockholmParts {
	year: number;
	month: number;
	day: number;
	hour: number;
	minute: number;
	second: number;
	/** 0 = Monday ... 6 = Sunday */
	dayOfWeek: number;
}

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const formatter = new Intl.DateTimeFormat('en-GB', {
	timeZone: STOCKHOLM_TZ,
	year: 'numeric',
	month: '2-digit',
	day: '2-digit',
	hour: '2-digit',
	minute: '2-digit',
	second: '2-digit',
	weekday: 'short',
	hourCycle: 'h23'
});

export function stockholmParts(ts: number): StockholmParts {
	const parts: Record<string, string> = {};
	for (const part of formatter.formatToParts(new Date(ts))) parts[part.type] = part.value;
	return {
		year: Number(parts.year),
		month: Number(parts.month),
		day: Number(parts.day),
		hour: Number(parts.hour),
		minute: Number(parts.minute),
		second: Number(parts.second),
		dayOfWeek: WEEKDAYS.indexOf(parts.weekday ?? '')
	};
}

/** Stockholm UTC offset in ms at instant `ts` (+1h winter, +2h summer). */
function offsetMs(ts: number): number {
	const p = stockholmParts(ts);
	const wholeSeconds = ts - (((ts % 1000) + 1000) % 1000);
	return Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second) - wholeSeconds;
}

/** The UTC instant at which Stockholm's wall clock shows the given time. */
export function stockholmWallTimeToUtc(year: number, month: number, day: number, hour: number, minute: number): number {
	const asUtc = Date.UTC(year, month - 1, day, hour, minute);
	// Two passes: the offset at the naive guess can differ from the offset at
	// the real instant when a DST change falls between them.
	const firstGuess = asUtc - offsetMs(asUtc);
	return asUtc - offsetMs(firstGuess);
}

/** Business date (yyyy-MM-dd) of `ts`; each day starts at 04:00 Stockholm. */
export function businessDate(ts: number): string {
	const p = stockholmParts(ts);
	const shift = p.hour < BUSINESS_DAY_START_HOUR ? 1 : 0;
	return new Date(Date.UTC(p.year, p.month - 1, p.day - shift)).toISOString().slice(0, 10);
}

export function addDays(date: string, days: number): string {
	const [year, month, day] = date.split('-').map(Number);
	return new Date(Date.UTC(year, month - 1, day + days)).toISOString().slice(0, 10);
}

const pad2 = (n: number) => String(n).padStart(2, '0');

/** Calendar date (yyyy-MM-dd) on Stockholm's wall clock; midnight boundary. */
export function stockholmDate(ts: number): string {
	const p = stockholmParts(ts);
	return `${p.year}-${pad2(p.month)}-${pad2(p.day)}`;
}

/** 0 = Monday ... 6 = Sunday for a yyyy-MM-dd date. */
export function dayOfWeekOf(date: string): number {
	const [year, month, day] = date.split('-').map(Number);
	return (new Date(Date.UTC(year, month - 1, day)).getUTCDay() + 6) % 7;
}

export function crossesMidnight(range: HoursRange): boolean {
	return range.closeMinutes < range.openMinutes;
}

/** Ranges starting on `date`: a special day replaces that weekday's hours. */
export function rangesForDate(hours: OpeningHours, date: string): HoursRange[] {
	const special = hours.specialDays.find((d) => d.date === date);
	if (special) return special.ranges;
	const day = dayOfWeekOf(date);
	return hours.weekly.filter((r) => r.dayOfWeek === day);
}

/**
 * True if `ts` falls in today's ranges or in a range from yesterday that
 * crosses midnight. Wall-clock minutes make DST changes need no special case.
 */
export function isWithinOpeningHours(hours: OpeningHours, ts: number): boolean {
	const p = stockholmParts(ts);
	const minute = p.hour * 60 + p.minute;
	const today = stockholmDate(ts);
	const todayOpen = rangesForDate(hours, today).some((r) =>
		crossesMidnight(r) ? minute >= r.openMinutes : minute >= r.openMinutes && minute < r.closeMinutes
	);
	if (todayOpen) return true;
	return rangesForDate(hours, addDays(today, -1)).some((r) => crossesMidnight(r) && minute < r.closeMinutes);
}

/** UTC instant of `minutes` past midnight on Stockholm date `date`. 1440 is the next midnight. */
export function stockholmInstant(date: string, minutes: number): number {
	const [year, month, day] = date.split('-').map(Number);
	return stockholmWallTimeToUtc(year, month, day, Math.floor(minutes / 60), minutes % 60);
}
