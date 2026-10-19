import type { OpeningHours, StatusInfo } from '$lib/types';
import { formatTime, relativeDay } from './format';
import { addDays, crossesMidnight, isWithinOpeningHours, rangesForDate, stockholmDate, stockholmInstant } from './stockholm-time';

/** open: taking orders. paused: staff stopped new orders. closed: outside hours, or switched off by Blinca. */
export type RestaurantState = 'open' | 'paused' | 'closed';

/** Same rule as the backend's restaurantState() (convex/lib/restaurantStatus.ts). */
export function restaurantState(info: StatusInfo, now: number): RestaurantState {
	if (!info.isActive) return 'closed';
	if (!info.isAcceptingOrders) return 'paused';
	if (info.pausedUntil !== undefined && now < info.pausedUntil) return 'paused';
	return isWithinOpeningHours(info.hours, now) ? 'open' : 'closed';
}

export interface OpenInterval {
	start: number;
	end: number;
}

/** Far enough ahead to cover every weekly pattern, including overnight spill. */
const LOOKAHEAD_DAYS = 8;

/** Opening intervals (epoch ms) overlapping [from, to), sorted and merged. */
export function openIntervals(hours: OpeningHours, from: number, to: number): OpenInterval[] {
	const intervals: OpenInterval[] = [];
	// Start a day early so yesterday's overnight shift is included.
	for (let date = addDays(stockholmDate(from), -1); stockholmInstant(date, 0) < to; date = addDays(date, 1)) {
		for (const range of rangesForDate(hours, date)) {
			if (range.openMinutes === range.closeMinutes) continue;
			const start = stockholmInstant(date, range.openMinutes);
			const end = crossesMidnight(range)
				? stockholmInstant(addDays(date, 1), range.closeMinutes)
				: stockholmInstant(date, range.closeMinutes);
			if (end > from && start < to) intervals.push({ start, end });
		}
	}
	intervals.sort((a, b) => a.start - b.start);

	const merged: OpenInterval[] = [];
	for (const interval of intervals) {
		const last = merged.at(-1);
		if (last && interval.start <= last.end) last.end = Math.max(last.end, interval.end);
		else merged.push({ ...interval });
	}
	return merged;
}

/**
 * When the opening hours next flip between open and closed. Null when they
 * don't flip within the next week (open around the clock, or no hours set).
 */
export function nextHoursChange(hours: OpeningHours, now: number): number | null {
	const horizon = now + LOOKAHEAD_DAYS * 86_400_000;
	const intervals = openIntervals(hours, now, horizon);
	const current = intervals.find((i) => i.start <= now && now < i.end);
	if (current) return current.end >= horizon ? null : current.end;
	return intervals.find((i) => i.start > now)?.start ?? null;
}

const at = (ts: number, now: number) => {
	const day = relativeDay(new Date(ts), new Date(now));
	return day === 'today' ? formatTime(ts) : `${formatTime(ts)} ${day}`;
};

/** Headline and helper line for the status card, in the brand voice. */
export function describeStatus(info: StatusInfo, now: number): { headline: string; detail: string } {
	const state = restaurantState(info, now);

	if (!info.isActive) {
		return { headline: "You're offline", detail: 'Blinca has switched off this restaurant. Contact Blinca support.' };
	}
	if (state === 'paused') {
		const until = info.isAcceptingOrders ? info.pausedUntil : undefined;
		return {
			headline: 'Orders paused',
			detail: until ? `New orders start again at ${at(until, now)}` : 'No new orders until you switch back on'
		};
	}

	const next = nextHoursChange(info.hours, now);
	if (state === 'open') {
		return { headline: "You're open", detail: next ? `Closes at ${at(next, now)}` : 'Open around the clock' };
	}
	if (!next) return { headline: "You're closed", detail: 'No opening hours set. Add them in the Blinca web portal.' };
	return { headline: "You're closed", detail: `Opens at ${at(next, now)}` };
}
