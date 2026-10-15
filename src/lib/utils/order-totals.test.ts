import { describe, expect, it } from 'vitest';
import { calculateOrderTotals, itemCount, lineTotal } from './order-totals';

const items = [
	{ quantity: 2, unitPrice: 14900 },
	{ quantity: 1, unitPrice: 5500 },
	{ quantity: 3, unitPrice: 3900 }
];

describe('calculateOrderTotals', () => {
	it('adds up line totals, VAT and delivery', () => {
		const totals = calculateOrderTotals({ items, discount: 0, deliveryFee: 2900, vatRate: 0.12 });
		expect(totals.subtotal).toBe(47000); // 29800 + 5500 + 11700
		expect(totals.vat).toBe(5640);
		expect(totals.total).toBe(47000 + 5640 + 2900);
	});

	it('charges VAT after the discount', () => {
		const totals = calculateOrderTotals({ items, discount: 4700, deliveryFee: 2900, vatRate: 0.12 });
		expect(totals.vat).toBe(Math.round((47000 - 4700) * 0.12));
		expect(totals.total).toBe(totals.subtotal - totals.discount + totals.vat + totals.deliveryFee);
	});

	it('rounds VAT to the nearest minor unit', () => {
		const totals = calculateOrderTotals({
			items: [{ quantity: 1, unitPrice: 12345 }],
			discount: 0,
			deliveryFee: 0,
			vatRate: 0.12
		});
		expect(totals.vat).toBe(1481);
		expect(Number.isInteger(totals.total)).toBe(true);
	});

	it('never discounts more than the subtotal', () => {
		const totals = calculateOrderTotals({ items, discount: 999999, deliveryFee: 2900, vatRate: 0.12 });
		expect(totals.discount).toBe(totals.subtotal);
		expect(totals.vat).toBe(0);
		expect(totals.total).toBe(2900);
	});

	it('counts items and line totals', () => {
		expect(itemCount(items)).toBe(6);
		expect(lineTotal(items[0])).toBe(29800);
	});
});
