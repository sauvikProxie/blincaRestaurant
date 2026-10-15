import { addHours, differenceInMinutes } from 'date-fns';
import { appConfig } from '$lib/config/app.config';
import { ACTIVE_STATUSES, PAST_STATUSES, type Order, type OrderStatus, type PastOrdersQuery } from '$lib/types';
import { toISODate } from '$lib/utils/format';
import { getRestaurantStatus } from '$lib/utils/restaurant-status';
import type { OrderEvent, OrdersService } from '../types';
import { db, nextSerialNo, persist } from './db';
import { mockRequest } from './latency';
import { createRandom } from './random';
import { buildOrder, completeDelivery } from './seed-orders';

/** Minutes a rider takes to collect a ready order, and to deliver it. */
const PICKUP_AFTER_MIN = 3;
const DELIVER_AFTER_MIN = 6;
/** Active orders older than this are tidied up when the app loads. */
const STALE_AFTER_HOURS = 3;

const isActive = (order: Order) => ACTIVE_STATUSES.includes(order.status);

export function createMockOrdersService(): OrdersService {
	const listeners = new Set<(event: OrderEvent) => void>();
	const random = createRandom(Date.now());
	let arrivalTimer: ReturnType<typeof setTimeout> | undefined;
	let progressTimer: ReturnType<typeof setInterval> | undefined;

	const emit = (event: OrderEvent) => listeners.forEach((listener) => listener(structuredClone(event)));

	function setStatus(order: Order, status: OrderStatus, now = new Date()): Order {
		const tables = db();
		const updated =
			status === 'delivered'
				? completeDelivery(order, differenceInMinutes(now, new Date(order.placedAt)))
				: { ...order, status };
		tables.orders = tables.orders.map((o) => (o.id === order.id ? updated : o));
		if (isActive(updated)) tables.statusChangedAt[order.id] = now.toISOString();
		else delete tables.statusChangedAt[order.id];
		persist('orders', 'statusChangedAt');
		return updated;
	}

	/** Finishes active orders left over from a previous session. */
	function tidyStaleOrders() {
		const cutoff = addHours(new Date(), -STALE_AFTER_HOURS);
		for (const order of db().orders.filter(isActive)) {
			if (new Date(order.placedAt) < cutoff) setStatus(order, order.status === 'pending' ? 'cancelled' : 'delivered');
		}
	}

	/** Riders collect ready orders and deliver them, so the board keeps moving. */
	function progressDeliveries() {
		const now = new Date();
		const tables = db();
		for (const order of tables.orders.filter(isActive)) {
			const since = differenceInMinutes(now, new Date(tables.statusChangedAt[order.id] ?? order.placedAt));
			if (order.status === 'ready_for_pickup' && since >= PICKUP_AFTER_MIN) {
				emit({ type: 'updated', order: setStatus(order, 'out_for_delivery', now) });
			} else if (order.status === 'out_for_delivery' && since >= DELIVER_AFTER_MIN) {
				emit({ type: 'updated', order: setStatus(order, 'delivered', now) });
			}
		}
	}

	function receiveOrder() {
		const tables = db();
		const now = new Date();
		const override = tables.overrides.at(-1) ?? null;
		if (!getRestaurantStatus(tables.schedule, override, now).isOpen) return;
		const context = { products: tables.products.filter((p) => p.isAvailable), discounts: tables.discounts, schedule: tables.schedule };
		if (!context.products.length) return;
		const order = buildOrder(random, context, { serialNo: nextSerialNo(), placedAt: now, status: 'pending' });
		tables.orders.push(order);
		tables.statusChangedAt[order.id] = now.toISOString();
		persist('orders', 'statusChangedAt');
		emit({ type: 'created', order });
	}

	function scheduleArrival() {
		const { min, max } = appConfig.mock.newOrderEverySeconds;
		arrivalTimer = setTimeout(
			() => {
				receiveOrder();
				scheduleArrival();
			},
			random.int(min, max) * 1000
		);
	}

	function startSimulation() {
		tidyStaleOrders();
		progressTimer = setInterval(progressDeliveries, 15_000);
		if (appConfig.mock.simulateIncomingOrders) scheduleArrival();
	}

	function stopSimulation() {
		clearTimeout(arrivalTimer);
		clearInterval(progressTimer);
	}

	return {
		listActive: () =>
			mockRequest(() => db().orders.filter(isActive).sort((a, b) => b.placedAt.localeCompare(a.placedAt))),

		listPast: (query: PastOrdersQuery) =>
			mockRequest(() => {
				const search = query.search?.trim().toLowerCase().replace(/^#/, '') ?? '';
				const matches = db().orders.filter((order) => {
					if (!PAST_STATUSES.includes(order.status)) return false;
					if (query.status && order.status !== query.status) return false;
					const day = toISODate(new Date(order.placedAt));
					if (query.from && day < query.from) return false;
					if (query.to && day > query.to) return false;
					if (!search) return true;
					return String(order.serialNo).includes(search) || order.customer.name.toLowerCase().includes(search);
				});
				const direction = query.sortDir === 'asc' ? 1 : -1;
				matches.sort((a, b) =>
					query.sortBy === 'total' ? (a.total - b.total) * direction : a.placedAt.localeCompare(b.placedAt) * direction
				);
				const start = (query.page - 1) * query.pageSize;
				return {
					items: matches.slice(start, start + query.pageSize),
					total: matches.length,
					page: query.page,
					pageSize: query.pageSize
				};
			}),

		getById: (id: string) => mockRequest(() => db().orders.find((order) => order.id === id) ?? null),

		updateStatus: (id: string, status: OrderStatus) =>
			mockRequest(() => {
				const order = db().orders.find((o) => o.id === id);
				if (!order) throw new Error(`Order ${id} not found`);
				const updated = setStatus(order, status);
				queueMicrotask(() => emit({ type: 'updated', order: updated }));
				return updated;
			}),

		subscribe(listener) {
			listeners.add(listener);
			if (listeners.size === 1) startSimulation();
			return () => {
				listeners.delete(listener);
				if (listeners.size === 0) stopSimulation();
			};
		}
	};
}
