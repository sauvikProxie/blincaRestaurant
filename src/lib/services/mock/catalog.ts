import { addMonths, isSameMonth } from 'date-fns';
import type { DiscountInput, Schedule, StatusOverride } from '$lib/types';
import { computeMonthlyMetrics } from '$lib/utils/performance';
import type {
	DiscountsService,
	MenuService,
	PerformanceService,
	ScheduleService,
	StatusService
} from '../types';
import { db, persist } from './db';
import { mockRequest } from './latency';
import { newId } from '$lib/utils/id';

export function createMockMenuService(): MenuService {
	return {
		list: () => mockRequest(() => db().products),
		setAvailability: (id, isAvailable) =>
			mockRequest(() => {
				const product = db().products.find((p) => p.id === id);
				if (!product) throw new Error(`Product ${id} not found`);
				product.isAvailable = isAvailable;
				persist('products');
				return product;
			})
	};
}

export function createMockScheduleService(): ScheduleService {
	return {
		get: () => mockRequest(() => db().schedule),
		save: (schedule: Schedule) =>
			mockRequest(() => {
				db().schedule = structuredClone(schedule);
				persist('schedule');
				return db().schedule;
			})
	};
}

export function createMockStatusService(): StatusService {
	return {
		listOverrides: () => mockRequest(() => db().overrides),
		startOverride: (override: StatusOverride) =>
			mockRequest(() => {
				db().overrides.push(structuredClone(override));
				persist('overrides');
			}),
		endOverride: (id, endedAt) =>
			mockRequest(() => {
				const override = db().overrides.find((o) => o.id === id);
				if (override && !override.endedAt) override.endedAt = endedAt;
				persist('overrides');
			})
	};
}

export function createMockDiscountsService(): DiscountsService {
	const find = (id: string) => {
		const discount = db().discounts.find((d) => d.id === id);
		if (!discount) throw new Error(`Discount ${id} not found`);
		return discount;
	};
	return {
		list: () => mockRequest(() => db().discounts),
		create: (input: DiscountInput) =>
			mockRequest(() => {
				const discount = { ...structuredClone(input), id: newId('dsc') };
				db().discounts.unshift(discount);
				persist('discounts');
				return discount;
			}),
		update: (id, input) =>
			mockRequest(() => {
				const discount = Object.assign(find(id), structuredClone(input), { id });
				if (discount.type !== 'bank_offer') delete discount.bankName;
				persist('discounts');
				return discount;
			}),
		remove: (id) =>
			mockRequest(() => {
				find(id);
				db().discounts = db().discounts.filter((d) => d.id !== id);
				persist('discounts');
			})
	};
}

export function createMockPerformanceService(): PerformanceService {
	return {
		getMonthlyReport: (month: Date) =>
			mockRequest(() => {
				const { orders, overrides, schedule } = db();
				const now = new Date();
				const metrics = (m: Date, until?: Date) =>
					computeMonthlyMetrics({ orders, overrides, schedule, month: m, now, until });
				// Month to date is compared with the same days of the previous month.
				const partial = isSameMonth(month, now);
				return {
					current: metrics(month),
					previous: metrics(addMonths(month, -1), partial ? addMonths(now, -1) : undefined),
					previousUntil: partial ? addMonths(now, -1) : null
				};
			})
	};
}
