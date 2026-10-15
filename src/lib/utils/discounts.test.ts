import { describe, expect, it } from 'vitest';
import type { Discount, DiscountInput } from '$lib/types';
import {
	calculateDiscountAmount,
	discountConditions,
	discountHeadline,
	getDiscountPhase,
	validateDiscount
} from './discounts';

const base: DiscountInput = {
	type: 'percentage',
	title: 'Welcome deal',
	value: 60,
	minOrder: 24900,
	maxDiscount: 12000,
	validFrom: '2026-10-01',
	validTo: '2026-10-31',
	isActive: true
};

describe('getDiscountPhase', () => {
	it('is scheduled before, live during and expired after the validity window', () => {
		expect(getDiscountPhase(base, new Date(2026, 8, 30))).toBe('scheduled');
		expect(getDiscountPhase(base, new Date(2026, 9, 1))).toBe('live');
		expect(getDiscountPhase(base, new Date(2026, 9, 31, 23, 59))).toBe('live');
		expect(getDiscountPhase(base, new Date(2026, 10, 1))).toBe('expired');
	});
});

describe('discount copy', () => {
	it('writes headlines in sentence case', () => {
		expect(discountHeadline(base)).toBe('60% off');
		expect(discountHeadline({ type: 'bogo', value: 0 })).toBe('Buy 1 get 1');
		expect(discountHeadline({ type: 'free_delivery', value: 0 })).toBe('Free delivery');
	});

	it('lists minimum order and cap', () => {
		const lines = discountConditions({ ...base, id: 'd1' } as Discount);
		expect(lines).toHaveLength(2);
		expect(lines[0]).toMatch(/^Min\. order 249/);
		expect(lines[1]).toMatch(/^Up to 120/);
	});
});

describe('calculateDiscountAmount', () => {
	it('applies the percentage up to the cap', () => {
		expect(calculateDiscountAmount(base, 30000)).toBe(12000);
		expect(calculateDiscountAmount({ ...base, value: 10 }, 30000)).toBe(3000);
	});

	it('returns 0 below the minimum order', () => {
		expect(calculateDiscountAmount(base, 20000)).toBe(0);
	});

	it('never takes a flat discount above the subtotal', () => {
		expect(calculateDiscountAmount({ ...base, type: 'flat', value: 5000, minOrder: 0 }, 3000)).toBe(3000);
	});
});

describe('validateDiscount', () => {
	it('accepts a valid offer', () => {
		expect(validateDiscount(base)).toEqual({});
	});

	it('keeps percentages between 1 and 100', () => {
		expect(validateDiscount({ ...base, value: 0 }).value).toBeDefined();
		expect(validateDiscount({ ...base, value: 101 }).value).toBeDefined();
		expect(validateDiscount({ ...base, value: 100 }).value).toBeUndefined();
	});

	it('requires a bank name for bank offers', () => {
		expect(validateDiscount({ ...base, type: 'bank_offer', bankName: ' ' }).bankName).toBeDefined();
		expect(validateDiscount({ ...base, type: 'bank_offer', bankName: 'SEB' }).bankName).toBeUndefined();
	});

	it('requires an end date on or after the start date', () => {
		expect(validateDiscount({ ...base, validTo: '2026-09-30' }).validTo).toBeDefined();
	});
});
