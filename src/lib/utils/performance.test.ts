import { describe, expect, it } from 'vitest';
import { WEEKDAYS, type Order, type Schedule, type StatusOverride } from '$lib/types';
import { computeMonthlyMetrics, missedHours, trend } from './performance';

// Open every day 10:00-22:00.
const schedule: Schedule = WEEKDAYS.map((day) => ({ day, isOpen: true, openTime: '10:00', closeTime: '22:00' }));
const at = (month: number, day: number, hour: number, minute = 0) => new Date(2026, month, day, hour, minute);
const now = at(9, 20, 12);

function closed(start: Date, expires: Date | null, ended?: Date): StatusOverride {
	return {
		id: start.toISOString(),
		status: 'closed',
		startedAt: start.toISOString(),
		expiresAt: expires?.toISOString() ?? null,
		endedAt: ended?.toISOString()
	};
}

describe('missedHours', () => {
	it('counts manual closes during open hours', () => {
		const overrides = [closed(at(9, 5, 14), at(9, 5, 22))];
		expect(missedHours(overrides, schedule, at(9, 1, 0), at(10, 1, 0), now)).toBe(8);
	});

	it('stops counting when someone returns to schedule early', () => {
		const overrides = [closed(at(9, 5, 14), at(9, 5, 22), at(9, 5, 15, 30))];
		expect(missedHours(overrides, schedule, at(9, 1, 0), at(10, 1, 0), now)).toBe(1.5);
	});

	it('ignores time outside opening hours and manual opens', () => {
		const overrides: StatusOverride[] = [
			closed(at(9, 6, 22, 30), at(9, 7, 10)),
			{ ...closed(at(9, 7, 23), at(9, 8, 10)), status: 'open' }
		];
		expect(missedHours(overrides, schedule, at(9, 1, 0), at(10, 1, 0), now)).toBe(0);
	});

	it('clips to the month and to now', () => {
		const spanning = [closed(at(8, 30, 20), null)];
		// Sep 30 20:00-22:00 is outside October; Oct 1-19 is 19 x 12 h, plus Oct 20 10:00-12:00.
		expect(missedHours(spanning, schedule, at(9, 1, 0), at(10, 1, 0), now)).toBe(19 * 12 + 2);
	});
});

function order(partial: Partial<Order>): Order {
	return {
		id: Math.random().toString(36),
		serialNo: 1,
		placedAt: at(9, 3, 12).toISOString(),
		customer: { name: 'A', phone: '', address: '' },
		items: [],
		status: 'delivered',
		subtotal: 0,
		discount: 0,
		vat: 0,
		deliveryFee: 0,
		total: 0,
		isDelayed: false,
		...partial
	};
}

describe('computeMonthlyMetrics', () => {
	it('counts orders, delays and ratings for the month only', () => {
		const orders = [
			order({ rating: 5 }),
			order({ rating: 4, isDelayed: true }),
			order({ status: 'cancelled' }),
			order({ placedAt: at(8, 28, 12).toISOString() }),
			order({ status: 'preparing' })
		];
		const metrics = computeMonthlyMetrics({ orders, overrides: [], schedule, month: at(9, 1, 0), now });
		expect(metrics.delivered).toBe(2);
		expect(metrics.cancelled).toBe(1);
		expect(metrics.delayed).toBe(1);
		expect(metrics.ratingAverage).toBe(4.5);
		expect(metrics.ratingCount).toBe(2);
		expect(metrics.daily).toHaveLength(31);
		expect(metrics.daily[2].delivered).toBe(2);
	});
});

describe('trend', () => {
	it('treats a rise as good when higher is better', () => {
		expect(trend(120, 100, 'higher')).toEqual({ percent: 20, direction: 'up', isGood: true });
	});

	it('treats a fall as good when lower is better', () => {
		expect(trend(3, 4, 'lower')).toEqual({ percent: 25, direction: 'down', isGood: true });
		expect(trend(5, 4, 'lower').isGood).toBe(false);
	});

	it('has no percentage when the previous month was zero', () => {
		expect(trend(4, 0, 'higher').percent).toBeNull();
	});
});

describe('month to date', () => {
	it('only counts up to the cutoff', () => {
		const orders = [order({ placedAt: at(9, 3, 12).toISOString() }), order({ placedAt: at(9, 25, 12).toISOString() })];
		const metrics = computeMonthlyMetrics({ orders, overrides: [], schedule, month: at(9, 1, 0), now, until: at(9, 13, 0) });
		expect(metrics.delivered).toBe(1);
		expect(metrics.daily).toHaveLength(31);
	});
});
