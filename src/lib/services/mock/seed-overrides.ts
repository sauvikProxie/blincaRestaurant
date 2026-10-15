import { addDays, addHours, addMonths, startOfMonth } from 'date-fns';
import type { Schedule, StatusOverride } from '$lib/types';
import { createOverride, getScheduledState } from '$lib/utils/restaurant-status';

/**
 * Past manual closes (kitchen issues, staff shortages) so Hours Missed has history.
 * Each entry: [months ago, day of month, hours closed]. Starts 14:00 on the first open day found.
 */
const PAST_CLOSES: [number, number, number][] = [
	[3, 6, 3],
	[3, 19, 2],
	[2, 4, 4],
	[2, 12, 1.5],
	[2, 23, 3],
	[1, 3, 2.5],
	[1, 15, 1],
	[0, 2, 2]
];

export function seedOverrides(schedule: Schedule, now: Date): StatusOverride[] {
	const overrides: StatusOverride[] = [];
	for (const [monthsAgo, dayOfMonth, hours] of PAST_CLOSES) {
		let start = addHours(addDays(startOfMonth(addMonths(now, -monthsAgo)), dayOfMonth - 1), 14);
		// Move forward to a day the restaurant is scheduled to be open at 14:00.
		for (let i = 0; i < 7 && getScheduledState(schedule, start).state === 'closed'; i++) {
			start = addDays(start, 1);
		}
		const endedAt = addHours(start, hours);
		if (endedAt >= now) continue;
		overrides.push({
			...createOverride(schedule, 'closed', start, `ovr_seed_${overrides.length + 1}`),
			endedAt: endedAt.toISOString()
		});
	}
	return overrides;
}
