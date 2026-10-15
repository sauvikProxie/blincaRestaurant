import { addMonths, eachDayOfInterval, isSameDay, startOfMonth } from 'date-fns';
import type { Order, Schedule, StatusOverride } from '$lib/types';
import { getOpenIntervals } from './restaurant-status';

export interface DailyOrders {
	date: Date;
	delivered: number;
	cancelled: number;
}

export interface MonthlyMetrics {
	delivered: number;
	cancelled: number;
	delayed: number;
	/** null when nobody rated this month. */
	ratingAverage: number | null;
	ratingCount: number;
	hoursMissed: number;
	daily: DailyOrders[];
}

const HOUR_MS = 3_600_000;

function monthBounds(month: Date): { start: Date; end: Date } {
	const start = startOfMonth(month);
	return { start, end: addMonths(start, 1) };
}

/**
 * Scheduled open hours lost to manual closes between `from` and `to`.
 * Uses the current schedule as the reference for which hours should have been open.
 */
export function missedHours(
	overrides: StatusOverride[],
	schedule: Schedule,
	from: Date,
	to: Date,
	now: Date
): number {
	const rangeEnd = to < now ? to : now;
	let missedMs = 0;
	for (const override of overrides) {
		if (override.status !== 'closed') continue;
		const ends = [rangeEnd, override.endedAt, override.expiresAt]
			.filter((value): value is string | Date => value !== undefined && value !== null)
			.map((value) => new Date(value).getTime());
		const start = Math.max(new Date(override.startedAt).getTime(), from.getTime());
		const end = Math.min(...ends);
		if (end <= start) continue;
		for (const open of getOpenIntervals(schedule, new Date(start), new Date(end))) {
			missedMs += Math.min(open.end.getTime(), end) - Math.max(open.start.getTime(), start);
		}
	}
	return missedMs / HOUR_MS;
}

export function computeMonthlyMetrics(input: {
	orders: Order[];
	overrides: StatusOverride[];
	schedule: Schedule;
	month: Date;
	now: Date;
	/** Only count up to this moment, e.g. to compare month-to-date with the same days last month. */
	until?: Date;
}): MonthlyMetrics {
	const { start, end: monthEnd } = monthBounds(input.month);
	const end = input.until && input.until < monthEnd ? input.until : monthEnd;
	const inMonth = input.orders.filter((order) => {
		const placed = new Date(order.placedAt);
		return placed >= start && placed < end;
	});
	const delivered = inMonth.filter((o) => o.status === 'delivered');
	const cancelled = inMonth.filter((o) => o.status === 'cancelled');
	const ratings = delivered.map((o) => o.rating).filter((r): r is number => r !== undefined);

	const lastDay = new Date(monthEnd.getTime() - 1);
	const daily = eachDayOfInterval({ start, end: lastDay }).map((date) => ({
		date,
		delivered: delivered.filter((o) => isSameDay(new Date(o.placedAt), date)).length,
		cancelled: cancelled.filter((o) => isSameDay(new Date(o.placedAt), date)).length
	}));

	return {
		delivered: delivered.length,
		cancelled: cancelled.length,
		delayed: delivered.filter((o) => o.isDelayed).length,
		ratingAverage: ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : null,
		ratingCount: ratings.length,
		hoursMissed: missedHours(input.overrides, input.schedule, start, end, input.now),
		daily
	};
}

export interface Trend {
	/** Percent change vs the previous value; null when there is nothing to compare against. */
	percent: number | null;
	direction: 'up' | 'down' | 'flat';
	/** Whether the change is good news, given which direction is better. */
	isGood: boolean;
}

export function trend(current: number, previous: number, betterWhen: 'higher' | 'lower'): Trend {
	if (current === previous) return { percent: 0, direction: 'flat', isGood: true };
	const direction = current > previous ? 'up' : 'down';
	const percent = previous === 0 ? null : Math.round((Math.abs(current - previous) / previous) * 100);
	const isGood = betterWhen === 'higher' ? direction === 'up' : direction === 'down';
	return { percent, direction, isGood };
}
