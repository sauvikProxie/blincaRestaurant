import type { Discount, DiscountInput, DiscountPhase, DiscountType } from '$lib/types';
import { formatMoney, toISODate } from './format';

export const DISCOUNT_TYPE_LABELS: Record<DiscountType, string> = {
	percentage: 'Percentage off',
	flat: 'Fixed amount off',
	bank_offer: 'Bank offer',
	free_delivery: 'Free delivery',
	bogo: 'Buy 1 get 1'
};

/** Which types take a percentage value and an optional cap. */
export const isPercentType = (type: DiscountType) => type === 'percentage' || type === 'bank_offer';

export function getDiscountPhase(discount: Pick<Discount, 'validFrom' | 'validTo'>, today: Date): DiscountPhase {
	const day = toISODate(today);
	if (day < discount.validFrom) return 'scheduled';
	if (day > discount.validTo) return 'expired';
	return 'live';
}

/** The big value on the coupon, in sentence case: "60% off", "50 kr off". */
export function discountHeadline(discount: Pick<Discount, 'type' | 'value'>): string {
	switch (discount.type) {
		case 'percentage':
		case 'bank_offer':
			return `${discount.value}% off`;
		case 'flat':
			return `${formatMoney(discount.value, { whole: true })} off`;
		case 'free_delivery':
			return 'Free delivery';
		case 'bogo':
			return 'Buy 1 get 1';
	}
}

/** Short condition lines shown under the headline. */
export function discountConditions(discount: Discount): string[] {
	const lines: string[] = [];
	if (discount.minOrder > 0) lines.push(`Min. order ${formatMoney(discount.minOrder, { whole: true })}`);
	else lines.push('No minimum order');
	if (isPercentType(discount.type) && discount.maxDiscount > 0) {
		lines.push(`Up to ${formatMoney(discount.maxDiscount, { whole: true })} off`);
	}
	return lines;
}

/** The discount an order of `subtotal` would get, in minor units. 0 if it doesn't qualify. */
export function calculateDiscountAmount(
	discount: Pick<Discount, 'type' | 'value' | 'minOrder' | 'maxDiscount'>,
	subtotal: number
): number {
	if (subtotal < discount.minOrder) return 0;
	switch (discount.type) {
		case 'percentage':
		case 'bank_offer': {
			const amount = Math.round((subtotal * discount.value) / 100);
			return discount.maxDiscount > 0 ? Math.min(amount, discount.maxDiscount) : amount;
		}
		case 'flat':
			return Math.min(discount.value, subtotal);
		default:
			// Free delivery and buy 1 get 1 depend on the basket, not just the subtotal.
			return 0;
	}
}

export type DiscountErrors = Partial<Record<keyof DiscountInput, string>>;

export function validateDiscount(input: DiscountInput): DiscountErrors {
	const errors: DiscountErrors = {};
	if (!input.title.trim()) errors.title = 'Give the offer a name';
	if (isPercentType(input.type)) {
		if (!Number.isInteger(input.value) || input.value < 1 || input.value > 100) {
			errors.value = 'Use a whole percentage from 1 to 100';
		}
	}
	if (input.type === 'flat') {
		if (!(input.value > 0)) errors.value = 'Enter an amount above 0';
		else if (input.minOrder > 0 && input.value >= input.minOrder) {
			errors.value = 'The amount off must be less than the minimum order';
		}
	}
	if (input.type === 'bank_offer' && !input.bankName?.trim()) errors.bankName = 'Add the bank name';
	if (!(input.minOrder >= 0)) errors.minOrder = 'Enter an amount of 0 or more';
	if (!(input.maxDiscount >= 0)) errors.maxDiscount = 'Enter an amount of 0 or more';
	if (!input.validFrom) errors.validFrom = 'Pick a start date';
	if (!input.validTo) errors.validTo = 'Pick an end date';
	if (input.validFrom && input.validTo && input.validTo < input.validFrom) {
		errors.validTo = 'End date must be on or after the start date';
	}
	return errors;
}
