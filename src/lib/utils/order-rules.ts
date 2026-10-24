/**
 * Busy-mode and prep-time rules, the same as the backend's
 * convex/lib/orderRules.ts. Worked out here against the live clock because the
 * backend's `defaultPrepMinutes` is only as fresh as the last status change:
 * a busy period that runs out on its own doesn't push an update.
 */
import { PREP_MINUTES, type StatusInfo } from '$lib/types';

const MAX_PREP_MINUTES = PREP_MINUTES[PREP_MINUTES.length - 1];

type BusyFields = Pick<StatusInfo, 'busyExtraMinutes' | 'busyUntil'>;

/** Extra prep minutes while busy mode is on; 0 when off or run out. */
export function activeBusyMinutes(info: BusyFields, now: number): number {
	if (info.busyExtraMinutes === undefined) return 0;
	if (info.busyUntil !== undefined && now >= info.busyUntil) return 0;
	return info.busyExtraMinutes;
}

/**
 * Prep time for a new ASAP order. Busy minutes add time only up to 60, and
 * never shorten a kitchen whose usual prep is already longer.
 */
export function defaultPrepMinutes(info: Pick<StatusInfo, 'prepTimeMinutes'> & BusyFields, now: number): number {
	const prep = info.prepTimeMinutes;
	return Math.max(prep, Math.min(prep + activeBusyMinutes(info, now), MAX_PREP_MINUTES));
}

/** Prep times the backend accepts from staff: the standard list, plus a slower kitchen's usual time. */
export function prepChoices(prepTimeMinutes: number): number[] {
	return prepTimeMinutes > MAX_PREP_MINUTES ? [...PREP_MINUTES, prepTimeMinutes] : [...PREP_MINUTES];
}

/** The smallest choice at or above `minutes`, else the largest. */
export function nearestPrepChoice(minutes: number, choices: readonly number[] = PREP_MINUTES): number {
	return choices.find((choice) => choice >= minutes) ?? choices[choices.length - 1];
}
