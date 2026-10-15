<script lang="ts">
	import Button from '$lib/components/ui/Button.svelte';
	import ConfirmDialog from '$lib/components/ui/ConfirmDialog.svelte';
	import { liveOrders } from '$lib/stores/live-orders.svelte';
	import { toasts } from '$lib/stores/toasts.svelte';
	import type { Order, OrderStatus } from '$lib/types';
	import { formatSerial } from '$lib/utils/format';
	import { NEXT_ACTIONS, type OrderAction } from './status-meta';

	let { order }: { order: Order } = $props();

	const actions = $derived(NEXT_ACTIONS[order.status] ?? []);
	const busy = $derived(liveOrders.pending.includes(order.id));
	let confirming = $state<OrderAction | null>(null);
	let running = $state<OrderStatus | null>(null);

	const DONE_MESSAGES: Partial<Record<OrderStatus, (serial: string) => string>> = {
		accepted: (s) => `Got it. ${s} is accepted.`,
		preparing: (s) => `${s} is being prepared.`,
		ready_for_pickup: (s) => `${s} is ready. We've let the rider know.`,
		cancelled: (s) => `${s} was rejected. We've told the customer.`
	};

	async function run(action: OrderAction) {
		running = action.to;
		try {
			await liveOrders.updateStatus(order.id, action.to);
			toasts.success(DONE_MESSAGES[action.to]?.(formatSerial(order.serialNo)) ?? 'Order updated');
			confirming = null;
		} catch {
			toasts.error("Sorry, that didn't go through. Please try again.");
		} finally {
			running = null;
		}
	}
</script>

{#each actions as action (action.to)}
	<Button
		variant={action.variant}
		loading={running === action.to}
		disabled={busy}
		onclick={() => (action.confirm ? (confirming = action) : run(action))}
	>
		{action.label}
	</Button>
{/each}

{#if confirming?.confirm}
	<ConfirmDialog
		open
		title={confirming.confirm.title}
		body={confirming.confirm.body}
		confirmLabel={confirming.confirm.confirmLabel}
		cancelLabel="Keep order"
		busy={running !== null}
		onconfirm={() => confirming && run(confirming)}
		oncancel={() => (confirming = null)}
	/>
{/if}
