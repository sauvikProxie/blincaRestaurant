import { ordersService } from '$lib/services';
import { ACTIVE_STATUSES, type Order, type OrderStatus } from '$lib/types';
import { formatSerial } from '$lib/utils/format';
import { toasts } from './toasts.svelte';

const isActive = (order: Order) => ACTIVE_STATUSES.includes(order.status);
const newestFirst = (a: Order, b: Order) => b.placedAt.localeCompare(a.placedAt);

/** Orders in progress, kept live through the orders service subscription. */
class LiveOrders {
	orders = $state<Order[]>([]);
	loading = $state(true);
	error = $state<Error | null>(null);
	/** Order ids whose status change is in flight. */
	pending = $state<string[]>([]);
	#unsubscribe: (() => void) | null = null;

	async load() {
		this.loading = true;
		this.error = null;
		try {
			this.orders = await ordersService.listActive();
		} catch (error) {
			this.error = error instanceof Error ? error : new Error(String(error));
		} finally {
			this.loading = false;
		}
	}

	connect() {
		if (this.#unsubscribe) return;
		this.#unsubscribe = ordersService.subscribe(({ type, order }) => {
			this.#apply(order);
			if (type === 'created') {
				toasts.show(`New order ${formatSerial(order.serialNo)} from ${order.customer.name}`);
			}
		});
	}

	disconnect() {
		this.#unsubscribe?.();
		this.#unsubscribe = null;
	}

	async updateStatus(id: string, status: OrderStatus): Promise<Order> {
		this.pending = [...this.pending, id];
		try {
			const order = await ordersService.updateStatus(id, status);
			this.#apply(order);
			return order;
		} finally {
			this.pending = this.pending.filter((p) => p !== id);
		}
	}

	#apply(order: Order) {
		const others = this.orders.filter((o) => o.id !== order.id);
		this.orders = isActive(order) ? [...others, order].sort(newestFirst) : others;
	}
}

export const liveOrders = new LiveOrders();
