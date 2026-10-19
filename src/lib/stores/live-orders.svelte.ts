import { ordersService, type Unsubscribe } from '$lib/services';
import { ACTIVE_STATUSES, type OrderSummary } from '$lib/types';
import { formatSerial } from '$lib/utils/format';
import { toasts } from './toasts.svelte';

/** New orders first, then those cooking, then those waiting for pickup; the backend's urgency order within each. */
const byStage = (orders: OrderSummary[]) =>
	[...orders].sort((a, b) => ACTIVE_STATUSES.indexOf(a.status) - ACTIVE_STATUSES.indexOf(b.status));

/** Orders in the kitchen, kept live by the backend. */
class LiveOrders {
	orders = $state<OrderSummary[]>([]);
	loading = $state(true);
	error = $state<Error | null>(null);
	/** Order ids with an action in flight. */
	pending = $state<string[]>([]);
	newCount = $derived(this.orders.filter((o) => o.status === 'new').length);
	#unsubscribe: Unsubscribe | null = null;
	/** Ids already on the board, so only genuinely new orders raise an alert. */
	#seen: Set<string> | null = null;

	connect() {
		if (this.#unsubscribe) return;
		this.loading = true;
		this.error = null;
		this.#unsubscribe = ordersService.watchBoard(
			(orders) => {
				this.#announce(orders);
				this.orders = byStage(orders);
				this.loading = false;
				this.error = null;
			},
			(error) => {
				this.error = error;
				this.loading = false;
			}
		);
	}

	disconnect() {
		this.#unsubscribe?.();
		this.#unsubscribe = null;
		this.#seen = null;
		this.orders = [];
		this.loading = true;
	}

	retry() {
		this.disconnect();
		this.connect();
	}

	/** Runs one order action, marking the order busy meanwhile. The live board shows the result. */
	async run(id: string, action: () => Promise<void>) {
		this.pending = [...this.pending, id];
		try {
			await action();
		} finally {
			this.pending = this.pending.filter((p) => p !== id);
		}
	}

	#announce(orders: OrderSummary[]) {
		const firstLoad = this.#seen === null;
		// Bookkeeping only, never rendered, so it needn't be reactive.
		// eslint-disable-next-line svelte/prefer-svelte-reactivity
		const seen = this.#seen ?? new Set<string>();
		for (const order of orders) {
			if (!firstLoad && !seen.has(order.id) && order.status === 'new') {
				toasts.show(`New order ${formatSerial(order.serialNo)} from ${order.customerName}`);
			}
			seen.add(order.id);
		}
		this.#seen = seen;
	}
}

export const liveOrders = new LiveOrders();
