<script lang="ts">
	import Inbox from '@lucide/svelte/icons/inbox';
	import DataTable, { type Column } from '$lib/components/ui/DataTable.svelte';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';
	import StatusBadge from '$lib/components/ui/StatusBadge.svelte';
	import { clock } from '$lib/stores/clock.svelte';
	import { liveOrders } from '$lib/stores/live-orders.svelte';
	import type { Order } from '$lib/types';
	import { formatMoney, formatSerial, formatTime, formatTimeAgo } from '$lib/utils/format';
	import { itemCount } from '$lib/utils/order-totals';

	const columns: Column[] = [
		{ key: 'serial', label: '#Serial No', width: '120px' },
		{ key: 'placed', label: 'Time placed' },
		{ key: 'customer', label: 'Customer' },
		{ key: 'items', label: 'Items', width: '80px' },
		{ key: 'status', label: 'Status' },
		{ key: 'amount', label: 'Amount', align: 'end' }
	];

	const isNew = (order: Order) => clock.now.getTime() - new Date(order.placedAt).getTime() < 60_000;
</script>

<DataTable
	caption="Active orders"
	{columns}
	rows={liveOrders.orders}
	rowKey={(order) => order.id}
	rowHref={(order) => `?order=${order.id}`}
	rowLabel={(order) => `Open order ${formatSerial(order.serialNo)} from ${order.customer.name}`}
	rowHighlight={isNew}
	loading={liveOrders.loading}
	error={liveOrders.error}
	errorWhat="your active orders"
	onretry={() => liveOrders.load()}
	skeletonRows={4}
>
	{#snippet cell(order, column)}
		{#if column.key === 'serial'}
			<span class="serial">{formatSerial(order.serialNo)}</span>
		{:else if column.key === 'placed'}
			<span class="placed">
				{formatTime(order.placedAt)}
				<span class="ago">{formatTimeAgo(order.placedAt, clock.now)}</span>
			</span>
		{:else if column.key === 'customer'}
			{order.customer.name}
		{:else if column.key === 'items'}
			{itemCount(order.items)}
		{:else if column.key === 'status'}
			<StatusBadge status={order.status} />
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

	.placed {
		display: inline-flex;
		flex-direction: column;
	}

	.ago {
		color: var(--color-text-muted);
		font-size: var(--text-caption);
		line-height: var(--lh-caption);
		letter-spacing: var(--ls-caption);
	}

	@media (max-width: 639px) {
		.placed {
			flex-direction: row;
			gap: var(--space-1);
			align-items: baseline;
		}
	}
</style>
