export const WEEKDAYS = [
	'monday',
	'tuesday',
	'wednesday',
	'thursday',
	'friday',
	'saturday',
	'sunday'
] as const;

export type Weekday = (typeof WEEKDAYS)[number];

export interface DaySchedule {
	day: Weekday;
	isOpen: boolean;
	/** "HH:mm", 24-hour. */
	openTime: string;
	/** "HH:mm", 24-hour. Earlier than openTime means the day runs past midnight. */
	closeTime: string;
}

/** One entry per weekday, Monday first. */
export type Schedule = DaySchedule[];

export type OpenState = 'open' | 'closed';

/** A manual open/close that overrides the schedule until expiresAt. */
export interface StatusOverride {
	id: string;
	status: OpenState;
	/** ISO timestamp. */
	startedAt: string;
	/** ISO timestamp of the next scheduled change when it was set; null if the schedule never changes. */
	expiresAt: string | null;
	/** ISO timestamp, set when someone returns to schedule early. */
	endedAt?: string;
}
