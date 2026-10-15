import { differenceInCalendarMonths } from 'date-fns';
import { describe, expect, it } from 'vitest';
import { appConfig } from '$lib/config/app.config';
import { calculateOrderTotals } from '$lib/utils/order-totals';
import { getScheduledState } from '$lib/utils/restaurant-status';
import { createRandom } from './random';
import { seedDiscounts } from './seed-discounts';
import { seedActiveOrders, seedOrderHistory } from './seed-orders';
import { seedOverrides } from './seed-overrides';
import { seedProducts } from './seed-products';
import { seedSchedule } from './seed-schedule';

const now = new Date(2026, 9, 13, 14, 30);
const context = { schedule: seedSchedule(), products: seedProducts(), discounts: seedDiscounts(now) };
const history = seedOrderHistory(createRandom(1), context, now);

describe('seeded mock data', () => {
	it('has 40+ past orders spanning at least 3 months', () => {
		expect(history.length).toBeGreaterThanOrEqual(40);
		expect(differenceInCalendarMonths(now, new Date(history[0].placedAt))).toBeGreaterThanOrEqual(3);
		expect(new Set(history.map((o) => o.status))).toEqual(new Set(['delivered', 'cancelled']));
	});

	it('only places orders during scheduled hours, with sequential serials', () => {
		for (const order of history) {
			expect(getScheduledState(context.schedule, new Date(order.placedAt)).state).toBe('open');
		}
		history.forEach((order, i) => expect(order.serialNo).toBe(history[0].serialNo + i));
	});

	it('has amounts that add up', () => {
		const active = seedActiveOrders(createRandom(2), context, now, 5000);
		for (const order of [...history, ...active]) {
			const totals = calculateOrderTotals({
				items: order.items,
				discount: order.discount,
				deliveryFee: order.deliveryFee,
				vatRate: appConfig.vatRate
			});
			expect(totals).toEqual({
				subtotal: order.subtotal,
				discount: order.discount,
				vat: order.vat,
				deliveryFee: order.deliveryFee,
				total: order.total
			});
			expect(order.total).toBe(order.subtotal - order.discount + order.vat + order.deliveryFee);
		}
	});

	it('includes a 15-25 item menu and override history for past months', () => {
		expect(context.products.length).toBeGreaterThanOrEqual(15);
		expect(context.products.length).toBeLessThanOrEqual(25);
		const overrides = seedOverrides(context.schedule, now);
		expect(overrides.length).toBeGreaterThan(3);
		expect(overrides.every((o) => o.endedAt && new Date(o.endedAt) < now)).toBe(true);
	});
});
