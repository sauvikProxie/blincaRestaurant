import { describe, expect, it } from 'vitest';
import { WEEKDAYS, type Schedule, type StatusOverride } from '$lib/types';
import {
	createOverride,
	describeStatus,
	getOpenIntervals,
	getRestaurantStatus,
	isOvernight,
	resolveToggle
} from './restaurant-status';

/** Local time helper. 12 Oct 2026 is a Monday. */
const at = (day: number, hour: number, minute = 0) => new Date(2026, 9, day, hour, minute);
const MON = 12;
const TUE = 13;
const WED = 14;
const SAT = 17;
const SUN = 18;

function makeSchedule(
	overrides: Partial<Record<(typeof WEEKDAYS)[number], [string, string] | null>> = {}
): Schedule {
	return WEEKDAYS.map((day) => {
		const hours = day in overrides ? overrides[day] : ['09:00', '22:00'];
		return hours
			? { day, isOpen: true, openTime: hours[0], closeTime: hours[1] }
			: { day, isOpen: false, openTime: '09:00', closeTime: '22:00' };
	});
}

describe('regular hours', () => {
	const schedule = makeSchedule();

	it('is open during scheduled hours and reports the closing time', () => {
		const status = getRestaurantStatus(schedule, null, at(TUE, 14));
		expect(status.isOpen).toBe(true);
		expect(status.source).toBe('schedule');
		expect(status.nextScheduledChange).toEqual(at(TUE, 22));
		expect(describeStatus(status, at(TUE, 14)).detail).toBe('Closes at 22:00 today');
	});

	it('opens exactly at the opening time and closes exactly at the closing time', () => {
		expect(getRestaurantStatus(schedule, null, at(TUE, 8, 59)).isOpen).toBe(false);
		expect(getRestaurantStatus(schedule, null, at(TUE, 9, 0)).isOpen).toBe(true);
		expect(getRestaurantStatus(schedule, null, at(TUE, 21, 59)).isOpen).toBe(true);
		expect(getRestaurantStatus(schedule, null, at(TUE, 22, 0)).isOpen).toBe(false);
	});

	it('before opening, says it opens today', () => {
		const status = getRestaurantStatus(schedule, null, at(TUE, 7));
		expect(status.nextScheduledChange).toEqual(at(TUE, 9));
		expect(describeStatus(status, at(TUE, 7)).detail).toBe('Opens today at 09:00');
	});

	it('after closing, says it opens tomorrow', () => {
		const status = getRestaurantStatus(schedule, null, at(TUE, 23));
		expect(status.isOpen).toBe(false);
		expect(status.nextScheduledChange).toEqual(at(WED, 9));
		expect(describeStatus(status, at(TUE, 23)).detail).toBe('Opens tomorrow at 09:00');
	});
});

describe('overnight hours', () => {
	// Friday and Saturday run 18:00 until 02:00 the next morning.
	const schedule = makeSchedule({ friday: ['18:00', '02:00'], saturday: ['18:00', '02:00'], sunday: null });

	it('detects overnight days', () => {
		expect(isOvernight({ openTime: '18:00', closeTime: '02:00' })).toBe(true);
		expect(isOvernight({ openTime: '09:00', closeTime: '22:00' })).toBe(false);
	});

	it('stays open after midnight under the previous day schedule', () => {
		// 01:30 on Sunday belongs to Saturday's 18:00-02:00 shift, even though Sunday is closed.
		const status = getRestaurantStatus(schedule, null, at(SUN, 1, 30));
		expect(status.isOpen).toBe(true);
		expect(status.nextScheduledChange).toEqual(at(SUN, 2));
		expect(describeStatus(status, at(SUN, 1, 30)).detail).toBe('Closes at 02:00 today');
	});

	it('closes at the overnight closing time', () => {
		expect(getRestaurantStatus(schedule, null, at(SUN, 2)).isOpen).toBe(false);
	});

	it('before midnight, the closing time reads as tomorrow', () => {
		const status = getRestaurantStatus(schedule, null, at(SAT, 23));
		expect(status.isOpen).toBe(true);
		expect(describeStatus(status, at(SAT, 23)).detail).toBe('Closes at 02:00 tomorrow');
	});

	it('merges back-to-back shifts into one interval', () => {
		const allNight = makeSchedule({ monday: ['18:00', '06:00'], tuesday: ['06:00', '18:00'] });
		const intervals = getOpenIntervals(allNight, at(MON, 12), at(TUE, 23, 59));
		expect(intervals[0]).toEqual({ start: at(MON, 18), end: at(TUE, 18) });
		const status = getRestaurantStatus(allNight, null, at(TUE, 5));
		expect(status.nextScheduledChange).toEqual(at(TUE, 18));
	});
});

describe('closed days', () => {
	const schedule = makeSchedule({ monday: null, tuesday: null });

	it('is closed all day on a closed day', () => {
		for (const hour of [0, 9, 12, 21, 23]) {
			expect(getRestaurantStatus(schedule, null, at(MON, hour)).isOpen).toBe(false);
		}
	});

	it('skips closed days when finding the next opening', () => {
		const status = getRestaurantStatus(schedule, null, at(MON, 12));
		expect(status.nextScheduledChange).toEqual(at(WED, 9));
		expect(describeStatus(status, at(MON, 12)).detail).toBe('Opens Wednesday at 09:00');
	});

	it('still honours an overnight shift that spills into a closed day', () => {
		const spill = makeSchedule({ sunday: ['20:00', '03:00'], monday: null });
		expect(getRestaurantStatus(spill, null, at(MON, 2)).isOpen).toBe(true);
		expect(getRestaurantStatus(spill, null, at(MON, 3)).isOpen).toBe(false);
	});

	it('says so when the whole week is closed', () => {
		const shut = makeSchedule(Object.fromEntries(WEEKDAYS.map((d) => [d, null])));
		const status = getRestaurantStatus(shut, null, at(TUE, 12));
		expect(status.isOpen).toBe(false);
		expect(status.nextScheduledChange).toBeNull();
	});

	it('ignores open days with identical opening and closing times', () => {
		const broken = makeSchedule({ tuesday: ['10:00', '10:00'] });
		expect(getRestaurantStatus(broken, null, at(TUE, 12)).isOpen).toBe(false);
	});
});

describe('manual override', () => {
	const schedule = makeSchedule();

	it('closing manually lasts until the next scheduled change', () => {
		const now = at(TUE, 14);
		const override = createOverride(schedule, 'closed', now, 'o1');
		expect(override.expiresAt).toBe(at(TUE, 22).toISOString());

		const status = getRestaurantStatus(schedule, override, now);
		expect(status.isOpen).toBe(false);
		expect(status.source).toBe('override');
		expect(status.overrideEndsAt).toEqual(at(TUE, 22));
		expect(describeStatus(status, now).detail).toBe('Manually closed: returns to schedule at 22:00');
	});

	it('opening manually outside hours lasts until the next opening', () => {
		const now = at(TUE, 23);
		const override = createOverride(schedule, 'open', now, 'o2');
		const status = getRestaurantStatus(schedule, override, at(TUE, 23, 30));
		expect(status.isOpen).toBe(true);
		expect(describeStatus(status, now).detail).toBe(
			'Manually opened: returns to schedule at 09:00 tomorrow'
		);
	});

	it('expires at the next scheduled change and returns to automatic mode', () => {
		// Manually opened at 23:00 Tue; the next change is the 09:00 Wed opening.
		const override = createOverride(schedule, 'open', at(TUE, 23), 'o3');
		const justBefore = getRestaurantStatus(schedule, override, at(WED, 8, 59));
		expect(justBefore.source).toBe('override');

		const atExpiry = getRestaurantStatus(schedule, override, at(WED, 9));
		expect(atExpiry.source).toBe('schedule');
		expect(atExpiry.override).toBeNull();
		expect(atExpiry.isOpen).toBe(true);

		// A manual close expires at closing time and the schedule (closed) takes over again.
		const close = createOverride(schedule, 'closed', at(WED, 12), 'o4');
		const after = getRestaurantStatus(schedule, close, at(WED, 22, 1));
		expect(after.source).toBe('schedule');
		expect(after.isOpen).toBe(false);
	});

	it('an override ended early no longer applies', () => {
		const override: StatusOverride = {
			...createOverride(schedule, 'closed', at(TUE, 14), 'o5'),
			endedAt: at(TUE, 15).toISOString()
		};
		const status = getRestaurantStatus(schedule, override, at(TUE, 15, 30));
		expect(status.source).toBe('schedule');
		expect(status.isOpen).toBe(true);
	});

	it('never expires when the schedule never changes', () => {
		const shut = makeSchedule(Object.fromEntries(WEEKDAYS.map((d) => [d, null])));
		const override = createOverride(shut, 'open', at(TUE, 12), 'o6');
		expect(override.expiresAt).toBeNull();
		const status = getRestaurantStatus(shut, override, at(SAT, 12));
		expect(status.isOpen).toBe(true);
		expect(describeStatus(status, at(SAT, 12)).detail).toBe(
			'Manually opened: stays this way until you return to schedule'
		);
	});

	it('toggling starts an override, toggling back returns to schedule', () => {
		const now = at(TUE, 14);
		const automatic = getRestaurantStatus(schedule, null, now);
		expect(resolveToggle(automatic)).toEqual({ action: 'override', status: 'closed' });

		const overridden = getRestaurantStatus(schedule, createOverride(schedule, 'closed', now, 'o7'), now);
		expect(resolveToggle(overridden)).toEqual({ action: 'return-to-schedule' });
	});
});
