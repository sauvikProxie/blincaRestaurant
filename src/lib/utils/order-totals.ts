import type { OrderItem } from '$lib/types';

export interface OrderTotals {
	subtotal: number;
	discount: number;
	vat: number;
	deliveryFee: number;
	total: number;
}

export function lineTotal(item: Pick<OrderItem, 'quantity' | 'unitPrice'>): number {
	return item.quantity * item.unitPrice;
}

/**
 * Order amounts in minor units. VAT is charged on the food subtotal after the
 * discount, and rounded to the nearest minor unit. The discount can never exceed
 * the subtotal.
 */
export function calculateOrderTotals(input: {
	items: Pick<OrderItem, 'quantity' | 'unitPrice'>[];
	discount: number;
	deliveryFee: number;
	vatRate: number;
}): OrderTotals {
	const subtotal = input.items.reduce((sum, item) => sum + lineTotal(item), 0);
	const discount = Math.min(Math.max(0, input.discount), subtotal);
	const vat = Math.round((subtotal - discount) * input.vatRate);
	const deliveryFee = Math.max(0, input.deliveryFee);
	return { subtotal, discount, vat, deliveryFee, total: subtotal - discount + vat + deliveryFee };
}

export function itemCount(items: Pick<OrderItem, 'quantity'>[]): number {
	return items.reduce((sum, item) => sum + item.quantity, 0);
}
