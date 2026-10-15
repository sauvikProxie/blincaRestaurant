import type { DaySchedule, Schedule, Weekday } from '$lib/types';
import { timeToMinutes } from './restaurant-status';

export interface DayErrors {
	openTime?: string;
	closeTime?: string;
}

export function validateDay(day: DaySchedule): DayErrors {
	if (!day.isOpen) return {};
	const errors: DayErrors = {};
	const open = timeToMinutes(day.openTime);
	const close = timeToMinutes(day.closeTime);
	if (open === null) errors.openTime = 'Add an opening time';
	if (close === null) errors.closeTime = 'Add a closing time';
	if (open !== null && close !== null && open === close) {
		errors.closeTime = 'Closing time must differ from opening time';
	}
	return errors;
}

export function validateSchedule(schedule: Schedule): Partial<Record<Weekday, DayErrors>> {
	const result: Partial<Record<Weekday, DayErrors>> = {};
	for (const day of schedule) {
		const errors = validateDay(day);
		if (errors.openTime || errors.closeTime) result[day.day] = errors;
	}
	return result;
}

/** Copies one day's hours and open/closed state onto the target days. */
export function copyDayTo(schedule: Schedule, source: Weekday, targets: readonly Weekday[]): Schedule {
	const from = schedule.find((d) => d.day === source);
	if (!from) return schedule;
	return schedule.map((d) =>
		targets.includes(d.day) && d.day !== source
			? { ...d, isOpen: from.isOpen, openTime: from.openTime, closeTime: from.closeTime }
			: d
	);
}

export function schedulesEqual(a: Schedule, b: Schedule): boolean {
	return a.length === b.length && a.every((day, i) => JSON.stringify(day) === JSON.stringify(b[i]));
}
