import { addDays, startOfDay } from 'date-fns';
import { WEEKDAYS, type DaySchedule, type OpenState, type Schedule, type StatusOverride } from '$lib/types';
import { formatTime, relativeDay } from './format';

export interface OpenInterval {
	start: Date;
	end: Date;
}

export interface RestaurantStatus {
	state: OpenState;
	isOpen: boolean;
	/** Whether the state comes from the schedule or a manual override. */
	source: 'schedule' | 'override';
	/** What the schedule alone says right now. */
	scheduledState: OpenState;
	/** Next time the schedule flips between open and closed; null if it never does. */
	nextScheduledChange: Date | null;
	/** The override in force, if any. */
	override: StatusOverride | null;
	/** When the override hands back to the schedule; null if no override or it never expires. */
	overrideEndsAt: Date | null;
}

/** Far enough ahead to cover every weekly pattern, including overnight spill. */
const LOOKAHEAD_DAYS = 8;

const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

/** Minutes after midnight for "HH:mm", or null if malformed. */
export function timeToMinutes(time: string): number | null {
	const match = TIME_PATTERN.exec(time);
	return match ? Number(match[1]) * 60 + Number(match[2]) : null;
}

/** 0 = Monday ... 6 = Sunday. */
export function weekdayIndex(date: Date): number {
	return (date.getDay() + 6) % 7;
}

/** True when the closing time is earlier than the opening time, i.e. the day runs past midnight. */
export function isOvernight(day: Pick<DaySchedule, 'openTime' | 'closeTime'>): boolean {
	const open = timeToMinutes(day.openTime);
	const close = timeToMinutes(day.closeTime);
	return open !== null && close !== null && close < open;
}

function atMinutes(day: Date, minutes: number): Date {
	return new Date(day.getFullYear(), day.getMonth(), day.getDate(), Math.floor(minutes / 60), minutes % 60);
}

/** The open interval that starts on `day`, following that weekday's schedule. */
function intervalForDay(schedule: Schedule, day: Date): OpenInterval | null {
	const entry = schedule.find((d) => d.day === WEEKDAYS[weekdayIndex(day)]);
	if (!entry?.isOpen) return null;
	const open = timeToMinutes(entry.openTime);
	const close = timeToMinutes(entry.closeTime);
	if (open === null || close === null || open === close) return null;
	const start = atMinutes(day, open);
	const end = close < open ? atMinutes(addDays(day, 1), close) : atMinutes(day, close);
	return { start, end };
}

/**
 * Scheduled open intervals overlapping [from, to), sorted and merged.
 * Starts a day early so an overnight shift from the previous day is included.
 */
export function getOpenIntervals(schedule: Schedule, from: Date, to: Date): OpenInterval[] {
	const intervals: OpenInterval[] = [];
	for (let day = addDays(startOfDay(from), -1); day < to; day = addDays(day, 1)) {
		const interval = intervalForDay(schedule, day);
		if (interval && interval.end > from && interval.start < to) intervals.push(interval);
	}
	intervals.sort((a, b) => a.start.getTime() - b.start.getTime());

	const merged: OpenInterval[] = [];
	for (const interval of intervals) {
		const last = merged.at(-1);
		if (last && interval.start <= last.end) {
			if (interval.end > last.end) last.end = interval.end;
		} else {
			merged.push({ ...interval });
		}
	}
	return merged;
}

/** What the schedule alone says at `now`, and when that next changes. */
export function getScheduledState(
	schedule: Schedule,
	now: Date
): { state: OpenState; nextChange: Date | null } {
	const intervals = getOpenIntervals(schedule, now, addDays(now, LOOKAHEAD_DAYS));
	const current = intervals.find((i) => i.start <= now && now < i.end);
	if (current) return { state: 'open', nextChange: current.end };
	const next = intervals.find((i) => i.start > now);
	return { state: 'closed', nextChange: next?.start ?? null };
}

export function isOverrideActive(override: StatusOverride | null, now: Date): boolean {
	if (!override || override.endedAt) return false;
	return override.expiresAt === null || now < new Date(override.expiresAt);
}

/**
 * The restaurant's status right now. Automatic from the schedule unless a manual
 * override is in force; overrides expire at the next scheduled change.
 */
export function getRestaurantStatus(
	schedule: Schedule,
	override: StatusOverride | null,
	now: Date
): RestaurantStatus {
	const scheduled = getScheduledState(schedule, now);
	const active = isOverrideActive(override, now) ? override : null;
	const state = active ? active.status : scheduled.state;
	return {
		state,
		isOpen: state === 'open',
		source: active ? 'override' : 'schedule',
		scheduledState: scheduled.state,
		nextScheduledChange: scheduled.nextChange,
		override: active,
		overrideEndsAt: active?.expiresAt ? new Date(active.expiresAt) : null
	};
}

/** A new override to `status`, lasting until the next scheduled opening or closing. */
export function createOverride(
	schedule: Schedule,
	status: OpenState,
	now: Date,
	id: string
): StatusOverride {
	const { nextChange } = getScheduledState(schedule, now);
	return {
		id,
		status,
		startedAt: now.toISOString(),
		expiresAt: nextChange ? nextChange.toISOString() : null
	};
}

/**
 * What flipping the toggle should do. Flipping back to what the schedule already
 * says simply returns to schedule; anything else starts an override.
 */
export function resolveToggle(
	current: RestaurantStatus
): { action: 'return-to-schedule' } | { action: 'override'; status: OpenState } {
	const desired: OpenState = current.isOpen ? 'closed' : 'open';
	return desired === current.scheduledState && current.source === 'override'
		? { action: 'return-to-schedule' }
		: { action: 'override', status: desired };
}

/** Headline and helper line for the status card, in the brand voice. */
export function describeStatus(status: RestaurantStatus, now: Date): { headline: string; detail: string } {
	const headline = status.isOpen ? "You're open" : "You're closed";

	if (status.source === 'override') {
		const verb = status.isOpen ? 'Manually opened' : 'Manually closed';
		const endsAt = status.overrideEndsAt;
		if (!endsAt) return { headline, detail: `${verb}: stays this way until you return to schedule` };
		const day = relativeDay(endsAt, now);
		const when = day === 'today' ? formatTime(endsAt) : `${formatTime(endsAt)} ${day}`;
		return { headline, detail: `${verb}: returns to schedule at ${when}` };
	}

	const next = status.nextScheduledChange;
	if (status.isOpen) {
		if (!next) return { headline, detail: 'No closing time on your schedule' };
		return { headline, detail: `Closes at ${formatTime(next)} ${relativeDay(next, now)}` };
	}
	if (!next) return { headline, detail: 'No opening hours set. Add some in Scheduled Hours.' };
	return { headline, detail: `Opens ${relativeDay(next, now)} at ${formatTime(next)}` };
}
