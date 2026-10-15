import { addDays, addMinutes, differenceInCalendarMonths, startOfDay } from 'date-fns';
import { appConfig } from '$lib/config/app.config';
import type { Customer, Discount, Order, OrderItem, OrderStatus, Product, Schedule } from '$lib/types';
import { calculateDiscountAmount, getDiscountPhase } from '$lib/utils/discounts';
import { calculateOrderTotals } from '$lib/utils/order-totals';
import { getOpenIntervals, weekdayIndex } from '$lib/utils/restaurant-status';
import type { Random } from './random';

const DELIVERY_FEE = 2900;
const HISTORY_DAYS = 120;
const FIRST_SERIAL = 1001;

const CUSTOMERS: Customer[] = [
	{ name: 'Erik Johansson', phone: '+46 70 412 33 81', address: 'Hornsgatan 54, 118 21 Stockholm' },
	{ name: 'Sara Lindqvist', phone: '+46 73 220 18 45', address: 'Folkungagatan 112, 116 30 Stockholm' },
	{ name: 'Oskar Berg', phone: '+46 72 905 61 07', address: 'Drottninggatan 81, 111 60 Stockholm' },
	{ name: 'Emma Nilsson', phone: '+46 70 338 72 19', address: 'Odengatan 23, 113 51 Stockholm' },
	{ name: 'Lucas Holm', phone: '+46 76 114 09 52', address: 'Sankt Eriksgatan 46, 112 34 Stockholm' },
	{ name: 'Maja Ek', phone: '+46 70 671 25 90', address: 'Fleminggatan 18, 112 26 Stockholm' },
	{ name: 'Elin Strand', phone: '+46 73 548 30 66', address: 'Hantverkargatan 32, 112 21 Stockholm' },
	{ name: 'Johan Sandberg', phone: '+46 70 902 14 38', address: 'Bondegatan 9, 116 23 Stockholm' },
	{ name: 'Nora Lund', phone: '+46 72 337 81 24', address: 'Renstiernas gata 27, 116 31 Stockholm' },
	{ name: 'William Dahl', phone: '+46 76 450 92 13', address: 'Tjurbergsgatan 14, 118 56 Stockholm' },
	{ name: 'Alva Forsberg', phone: '+46 70 289 63 70', address: 'Katarina Bangata 61, 116 39 Stockholm' },
	{ name: 'Hugo Engstrom', phone: '+46 73 816 40 05', address: 'Wollmar Yxkullsgatan 7, 118 50 Stockholm' },
	{ name: 'Ines Carlsson', phone: '+46 72 643 17 88', address: 'Rosenlundsgatan 40, 118 53 Stockholm' },
	{ name: 'Leo Martinsson', phone: '+46 70 125 58 31', address: 'Torsgatan 12, 111 23 Stockholm' },
	{ name: 'Wilma Ahmed', phone: '+46 76 778 21 49', address: 'Birger Jarlsgatan 98, 114 20 Stockholm' },
	{ name: 'Adam Persson', phone: '+46 73 361 07 62', address: 'Upplandsgatan 33, 113 28 Stockholm' },
	{ name: 'Ella Wikander', phone: '+46 70 554 90 16', address: 'Kungsgatan 44, 111 35 Stockholm' },
	{ name: 'Noah Pettersson', phone: '+46 72 208 66 73', address: 'Ringvagen 101, 118 60 Stockholm' },
	{ name: 'Freja Svensson', phone: '+46 76 931 45 27', address: 'Blekingegatan 15, 118 56 Stockholm' },
	{ name: 'Liam Novak', phone: '+46 70 486 13 94', address: 'Timmermansgatan 22, 118 25 Stockholm' },
	{ name: 'Selma Hassan', phone: '+46 73 702 39 58', address: 'Krukmakargatan 5, 118 51 Stockholm' },
	{ name: 'Viktor Lindgren', phone: '+46 72 115 84 60', address: 'Polhemsgatan 29, 112 30 Stockholm' },
	{ name: 'Astrid Moberg', phone: '+46 70 863 27 03', address: 'Bellmansgatan 10, 118 20 Stockholm' },
	{ name: 'Elias Kowalski', phone: '+46 76 249 70 85', address: 'Heleneborgsgatan 8, 117 32 Stockholm' }
];

const NOTES = [
	'No onions, please',
	'Extra spicy',
	'Nut allergy - please take care',
	'Sauce on the side',
	'Cut in half, please',
	'No cheese',
	'Gluten-free base if possible'
];

/** Weekday order volume (Monday first) and how busy each month was, most recent first. */
const ORDERS_PER_DAY: [number, number][] = [
	[1, 2],
	[2, 4],
	[2, 4],
	[3, 5],
	[4, 7],
	[4, 7],
	[3, 5]
];
const MONTH_FACTOR = [1.1, 1.0, 0.9, 0.85, 0.8];

export interface SeedContext {
	products: Product[];
	discounts: Discount[];
	schedule: Schedule;
}

function pickItems(random: Random, products: Product[]): OrderItem[] {
	const byCategory = (category: string) => products.filter((p) => p.category === category);
	const mains = [...byCategory('Mains'), ...byCategory('Wood-fired pizza')];
	const extras = [...byCategory('Starters'), ...byCategory('Sides'), ...byCategory('Desserts')];
	const drinks = byCategory('Drinks');

	const chosen = new Map<string, OrderItem>();
	const add = (product: Product, quantity: number) => {
		const existing = chosen.get(product.id);
		if (existing) existing.quantity += quantity;
		else chosen.set(product.id, { productId: product.id, name: product.name, quantity, unitPrice: product.price });
	};

	add(random.pick(mains), random.chance(0.35) ? 2 : 1);
	if (random.chance(0.4)) add(random.pick(mains), 1);
	if (random.chance(0.55)) add(random.pick(extras), 1);
	if (random.chance(0.6)) add(random.pick(drinks), random.int(1, 3));

	const items = [...chosen.values()];
	if (random.chance(0.25)) random.pick(items).notes = random.pick(NOTES);
	return items;
}

function pickDiscount(random: Random, discounts: Discount[], subtotal: number, placedAt: Date) {
	if (!random.chance(0.3)) return { amount: 0, label: undefined };
	const eligible = discounts.filter(
		(d) =>
			(d.type === 'percentage' || d.type === 'flat' || d.type === 'bank_offer') &&
			getDiscountPhase(d, placedAt) === 'live' &&
			calculateDiscountAmount(d, subtotal) > 0
	);
	if (!eligible.length) return { amount: 0, label: undefined };
	const offer = random.pick(eligible);
	return { amount: calculateDiscountAmount(offer, subtotal), label: offer.title };
}

/** Builds an order whose amounts are always calculated from its items. */
export function buildOrder(
	random: Random,
	context: SeedContext,
	fields: { serialNo: number; placedAt: Date; status: OrderStatus }
): Order {
	const items = pickItems(random, context.products);
	const itemsSubtotal = items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);
	const discount = pickDiscount(random, context.discounts, itemsSubtotal, fields.placedAt);
	const totals = calculateOrderTotals({
		items,
		discount: discount.amount,
		deliveryFee: DELIVERY_FEE,
		vatRate: appConfig.vatRate
	});
	return {
		id: `ord_${fields.serialNo}`,
		serialNo: fields.serialNo,
		placedAt: fields.placedAt.toISOString(),
		customer: random.pick(CUSTOMERS),
		items,
		status: fields.status,
		...totals,
		discountLabel: discount.label,
		isDelayed: false
	};
}

/** Marks an order delivered after `minutes`, flagging it late past the configured threshold. */
export function completeDelivery(order: Order, minutes: number, rating?: number): Order {
	return {
		...order,
		status: 'delivered',
		deliveredAt: addMinutes(new Date(order.placedAt), minutes).toISOString(),
		isDelayed: minutes > appConfig.orders.delayedAfterMinutes,
		rating
	};
}

/** Past orders placed during scheduled hours over the last ~4 months. */
export function seedOrderHistory(random: Random, context: SeedContext, now: Date): Order[] {
	const orders: Order[] = [];
	const latestPlacement = addMinutes(now, -90);

	for (let day = startOfDay(addDays(now, -HISTORY_DAYS)); day <= now; day = addDays(day, 1)) {
		const shifts = getOpenIntervals(context.schedule, day, addDays(day, 1)).filter((i) => i.start >= day);
		if (!shifts.length) continue;
		const shift = shifts[0];
		const shiftEnd = Math.min(addMinutes(shift.end, -30).getTime(), latestPlacement.getTime());
		if (shiftEnd <= shift.start.getTime()) continue;

		const [min, max] = ORDERS_PER_DAY[weekdayIndex(day)];
		const factor = MONTH_FACTOR[Math.min(differenceInCalendarMonths(now, day), MONTH_FACTOR.length - 1)];
		const count = Math.round(random.int(min, max) * factor);

		for (let n = 0; n < count; n++) {
			const placedAt = new Date(shift.start.getTime() + random.next() * (shiftEnd - shift.start.getTime()));
			const order = buildOrder(random, context, { serialNo: 0, placedAt, status: 'cancelled' });
			if (random.chance(0.07)) {
				orders.push(order);
				continue;
			}
			const late = random.chance(0.12);
			const minutes = late ? random.int(48, 75) : random.int(22, 44);
			const rating = random.chance(0.65)
				? random.pick(late ? [2, 3, 3, 4, 4, 5] : [3, 4, 4, 5, 5, 5, 5])
				: undefined;
			orders.push(completeDelivery(order, minutes, rating));
		}
	}

	orders.sort((a, b) => a.placedAt.localeCompare(b.placedAt));
	return orders.map((order, index) => ({
		...order,
		serialNo: FIRST_SERIAL + index,
		id: `ord_${FIRST_SERIAL + index}`
	}));
}

/** A handful of in-progress orders, one per active status. */
export function seedActiveOrders(random: Random, context: SeedContext, now: Date, firstSerial: number): Order[] {
	const plan: [OrderStatus, number][] = [
		['out_for_delivery', 31],
		['ready_for_pickup', 22],
		['preparing', 14],
		['accepted', 7],
		['pending', 2]
	];
	return plan.map(([status, minutesAgo], index) =>
		buildOrder(random, context, {
			serialNo: firstSerial + index,
			placedAt: addMinutes(now, -minutesAgo),
			status
		})
	);
}
