import { addDays, addMonths, endOfMonth, startOfMonth } from 'date-fns';
import type { Discount } from '$lib/types';
import { toISODate } from '$lib/utils/format';

/** Offers relative to `today`: a mix of live, scheduled, paused and expired. */
export function seedDiscounts(today: Date): Discount[] {
	const d = toISODate;
	return [
		{
			id: 'dsc_welcome',
			type: 'percentage',
			title: 'Welcome deal for new customers',
			value: 60,
			minOrder: 24900,
			maxDiscount: 12000,
			validFrom: d(startOfMonth(today)),
			validTo: d(endOfMonth(addMonths(today, 1))),
			isActive: true
		},
		{
			id: 'dsc_flat10',
			type: 'percentage',
			title: 'Flat 10% off every order',
			value: 10,
			minOrder: 0,
			maxDiscount: 0,
			validFrom: d(addMonths(startOfMonth(today), -4)),
			validTo: d(endOfMonth(addMonths(today, 2))),
			isActive: true
		},
		{
			id: 'dsc_seb',
			type: 'bank_offer',
			title: '15% off with SEB cards',
			value: 15,
			minOrder: 20000,
			maxDiscount: 10000,
			bankName: 'SEB',
			validFrom: d(addDays(today, -10)),
			validTo: d(addDays(today, 20)),
			isActive: true
		},
		{
			id: 'dsc_freedel',
			type: 'free_delivery',
			title: 'Free delivery on bigger orders',
			value: 0,
			minOrder: 30000,
			maxDiscount: 0,
			validFrom: d(addDays(today, -30)),
			validTo: d(addDays(today, 60)),
			isActive: true
		},
		{
			id: 'dsc_bogo',
			type: 'bogo',
			title: 'Pizza night: buy 1 get 1',
			value: 0,
			minOrder: 0,
			maxDiscount: 0,
			validFrom: d(addDays(today, -5)),
			validTo: d(addDays(today, 25)),
			isActive: false
		},
		{
			id: 'dsc_lunch',
			type: 'flat',
			title: 'Lunch deal',
			value: 5000,
			minOrder: 19900,
			maxDiscount: 0,
			validFrom: d(addDays(today, 7)),
			validTo: d(addDays(today, 37)),
			isActive: true
		},
		{
			id: 'dsc_swedbank',
			type: 'bank_offer',
			title: '20% off with Swedbank cards',
			value: 20,
			minOrder: 25000,
			maxDiscount: 8000,
			bankName: 'Swedbank',
			validFrom: d(addMonths(startOfMonth(today), -3)),
			validTo: d(addDays(startOfMonth(today), -1)),
			isActive: true
		}
	];
}
