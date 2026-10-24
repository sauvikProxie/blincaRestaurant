import { describe, expect, it } from 'vitest';
import type { OpeningHours, StatusInfo } from '$lib/types';
import { describeStatus, nextHoursChange, restaurantState } from './restaurant-status';
import { businessDate, isWithinOpeningHours, stockholmInstant } from './stockholm-time';

// 2026-10-13 is a Tuesday (dayOfWeek 1). Times are Stockholm wall clock,
// so these tests pass whatever time zone the machine running them is in.
const TUE = '2026-10-13';
const at = (date: string, hour: number, minute = 0) => stockholmInstant(date, hour * 60 + minute);

const everyDay = (openMinutes: number, closeMinutes: number): OpeningHours => ({
	weekly: [0, 1, 2, 3, 4, 5, 6].map((dayOfWeek) => ({ dayOfWeek, openMinutes, closeMinutes })),
	specialDays: []
});

const info = (hours: OpeningHours, extra: Partial<StatusInfo> = {}): StatusInfo => ({
	isActive: true,
	isAcceptingOrders: true,
	prepTimeMinutes: 20,
	autoAccept: false,
	defaultPrepMinutes: 20,
	hours,
	...extra
});

describe('restaurantState', () => {
	const hours = everyDay(10 * 60, 22 * 60);

	it('follows the opening hours', () => {
		expect(restaurantState(info(hours), at(TUE, 14))).toBe('open');
		expect(restaurantState(info(hours), at(TUE, 23))).toBe('closed');
	});

	it('is paused until the pause runs out', () => {
		const paused = info(hours, { pausedUntil: at(TUE, 14, 30) });
		expect(restaurantState(paused, at(TUE, 14))).toBe('paused');
		expect(restaurantState(paused, at(TUE, 14, 30))).toBe('open');
	});

	it('is paused indefinitely when not accepting orders', () => {
		expect(restaurantState(info(hours, { isAcceptingOrders: false }), at(TUE, 14))).toBe('paused');
	});

	it('is closed when Blinca switched the restaurant off', () => {
		expect(restaurantState(info(hours, { isActive: false }), at(TUE, 14))).toBe('closed');
	});
});

describe('opening hours', () => {
	it('handles ranges that run past midnight', () => {
		const late = everyDay(18 * 60, 2 * 60);
		expect(isWithinOpeningHours(late, at('2026-10-14', 1))).toBe(true);
		expect(isWithinOpeningHours(late, at('2026-10-14', 3))).toBe(false);
		expect(nextHoursChange(late, at(TUE, 23))).toBe(at('2026-10-14', 2));
	});

	it('lets a special day replace the weekly hours', () => {
		const hours: OpeningHours = { ...everyDay(10 * 60, 22 * 60), specialDays: [{ date: TUE, ranges: [] }] };
		expect(isWithinOpeningHours(hours, at(TUE, 14))).toBe(false);
		expect(nextHoursChange(hours, at(TUE, 14))).toBe(at('2026-10-14', 10));
	});

	it('has no next change when open around the clock', () => {
		expect(nextHoursChange(everyDay(0, 1440), at(TUE, 14))).toBeNull();
	});

	it('has no next change without any hours', () => {
		expect(nextHoursChange({ weekly: [], specialDays: [] }, at(TUE, 14))).toBeNull();
	});
});

describe('describeStatus', () => {
	const hours = everyDay(10 * 60, 22 * 60);

	it('says when an open restaurant closes', () => {
		expect(describeStatus(info(hours), at(TUE, 14))).toEqual({ headline: "You're open", detail: 'Closes at 22:00' });
	});

	it('says when a closed restaurant opens', () => {
		expect(describeStatus(info(hours), at(TUE, 23)).detail).toBe('Opens at 10:00 tomorrow');
	});

	it('says when a pause ends', () => {
		const paused = info(hours, { pausedUntil: at(TUE, 14, 30) });
		expect(describeStatus(paused, at(TUE, 14))).toEqual({
			headline: 'Orders paused',
			detail: 'New orders start again at 14:30'
		});
	});

	it('explains an indefinite pause', () => {
		expect(describeStatus(info(hours, { isAcceptingOrders: false }), at(TUE, 14)).detail).toBe(
			'No new orders until you switch back on'
		);
	});
});

describe('businessDate', () => {
	it('counts the small hours as the previous day', () => {
		expect(businessDate(at('2026-10-14', 3, 59))).toBe(TUE);
		expect(businessDate(at('2026-10-14', 4))).toBe('2026-10-14');
	});
});
