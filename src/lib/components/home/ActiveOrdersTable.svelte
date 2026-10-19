<script lang="ts">
	import Inbox from '@lucide/svelte/icons/inbox';
	import { FULFILLMENT_META, isUrgent, timingNote } from '$lib/components/orders/status-meta';
	import DataTable, { type Column } from '$lib/components/ui/DataTable.svelte';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';
	import StatusBadge from '$lib/components/ui/StatusBadge.svelte';
	import { clock } from '$lib/stores/clock.svelte';
	import { liveOrders } from '$lib/stores/live-orders.svelte';
	import type { OrderSummary } from '$lib/types';
	import { formatMoney, formatSerial, formatTime, formatTimeAgo } from '$lib/utils/format';

	const columns: Column[] = [
		{ key: 'serial', label: '#Order', width: '100px' },
		{ key: 'placed', label: 'Time placed' },
		{ key: 'customer', label: 'Customer' },
		{ key: 'type', label: 'Type' },
		{ key: 'items', label: 'Items', width: '80px' },
		{ key: 'status', label: 'Status' },
		{ key: 'amount', label: 'Amount', align: 'end' }
	];

	const now = $derived(clock.now.getTime());
	const needsAction = (order: OrderSummary) => order.status === 'new';
</script>

<DataTable
	caption="Active orders"
	{columns}
	rows={liveOrders.orders}
	rowKey={(order) => order.id}
	rowHref={(order) => `?order=${order.id}`}
	rowLabel={(order) => `Open order ${formatSerial(order.serialNo)} from ${order.customerName}`}
	rowHighlight={needsAction}
	loading={liveOrders.loading}
	error={liveOrders.error}
	errorWhat="your active orders"
	onretry={() => liveOrders.retry()}
	skeletonRows={4}
>
	{#snippet cell(order, column)}
		{#if column.key === 'serial'}
			<span class="serial">{formatSerial(order.serialNo)}</span>
		{:else if column.key === 'placed'}
			<span class="stacked">
				{formatTime(order.placedAt)}
				<span class="caption">{formatTimeAgo(order.placedAt, clock.now)}</span>
			</span>
		{:else if column.key === 'customer'}
			{order.customerName}
		{:else if column.key === 'type'}
			{FULFILLMENT_META[order.fulfillment].label}
		{:else if column.key === 'items'}
			{order.itemCount}
		{:else if column.key === 'status'}
			<span class="stacked">
				<StatusBadge status={order.status} />
				<span class="caption" class:urgent={isUrgent(order, now)}>{timingNote(order, now)}</span>
			</span>
		{:else if column.key === 'amount'}
			{formatMoney(order.total)}
		{/if}
	{/snippet}

	{#snippet empty()}
		<EmptyState icon={Inbox} title="No Active Orders" description="New orders will appear here automatically." />
	{/snippet}
</DataTable>

<style>
	.serial {
		color: var(--color-action);
	}

	.stacked {
		display: inline-flex;
		flex-direction: column;
		align-items: flex-start;
		gap: var(--space-half);
	}

	.caption {
		color: var(--color-text-muted);
		font-size: var(--text-caption);
		line-height: var(--lh-caption);
		letter-spacing: var(--ls-caption);
	}

	.caption.urgent {
		color: var(--color-action);
	}

	@media (max-width: 639px) {
		.stacked {
			flex-direction: row;
			gap: var(--space-1);
			align-items: baseline;
		}
	}
</style>
