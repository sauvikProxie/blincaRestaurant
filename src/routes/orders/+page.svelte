<script lang="ts">
	import Receipt from '@lucide/svelte/icons/receipt';
	import SearchX from '@lucide/svelte/icons/search-x';
	import { FULFILLMENT_META, REFUND_LABELS } from '$lib/components/orders/status-meta';
	import Button from '$lib/components/ui/Button.svelte';
	import Chip from '$lib/components/ui/Chip.svelte';
	import DataTable, { type Column } from '$lib/components/ui/DataTable.svelte';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';
	import PageHeader from '$lib/components/ui/PageHeader.svelte';
	import SearchInput from '$lib/components/ui/SearchInput.svelte';
	import StatusBadge from '$lib/components/ui/StatusBadge.svelte';
	import { appConfig } from '$lib/config/app.config';
	import { toError } from '$lib/convex/errors';
	import { ordersService } from '$lib/services';
	import type { HistoryQuery, OrderSummary } from '$lib/types';
	import { formatDate, formatMoney, formatSerial, formatTime } from '$lib/utils/format';
	import { addDays, businessDate } from '$lib/utils/stockholm-time';

	type StatusFilter = 'all' | 'picked_up' | 'rejected' | 'cancelled';

	/** The backend reads at most this many days per request. */
	const MAX_RANGE_DAYS = 92;

	const columns: Column[] = [
		{ key: 'placedAt', label: 'Time' },
		{ key: 'serial', label: '#Order' },
		{ key: 'customer', label: 'Customer' },
		{ key: 'type', label: 'Type' },
		{ key: 'status', label: 'Status' },
		{ key: 'total', label: 'Amount', align: 'end' }
	];

	const today = businessDate(Date.now());
	const defaultFrom = addDays(today, -(appConfig.orders.historyDays - 1));

	let search = $state('');
	let debouncedSearch = $state('');
	let status = $state<StatusFilter>('all');
	let from = $state(defaultFrom);
	let to = $state(today);

	let orders = $state<OrderSummary[]>([]);
	let cursor = $state<string | null>(null);
	let isDone = $state(true);
	let loading = $state(true);
	let loadingMore = $state(false);
	let error = $state<Error | null>(null);
	let request = 0;

	const query = $derived<HistoryQuery>({
		from,
		to,
		status: status === 'all' ? undefined : status,
		search: debouncedSearch || undefined
	});

	const hasFilters = $derived(!!(debouncedSearch || status !== 'all' || from !== defaultFrom || to !== today));
	const dateError = $derived.by(() => {
		if (!from || !to) return 'Pick both dates';
		if (to < from) return 'End date must be on or after the start date';
		if (from < addDays(to, -(MAX_RANGE_DAYS - 1))) return `Pick at most ${MAX_RANGE_DAYS} days`;
		return '';
	});

	$effect(() => {
		const value = search.trim();
		const timer = setTimeout(() => (debouncedSearch = value), 250);
		return () => clearTimeout(timer);
	});

	// Any filter change starts again from the newest orders.
	$effect(() => {
		if (dateError) return;
		void query;
		load(true);
	});

	async function load(reset: boolean) {
		const current = ++request;
		if (reset) loading = true;
		else loadingMore = true;
		error = null;
		try {
			const page = await ordersService.history(query, reset ? null : cursor, appConfig.orders.pageSize);
			if (current !== request) return;
			orders = reset ? page.orders : [...orders, ...page.orders];
			cursor = page.cursor;
			isDone = page.isDone;
		} catch (e) {
			if (current === request) error = toError(e);
		} finally {
			if (current === request) {
				loading = false;
				loadingMore = false;
			}
		}
	}

	function clearFilters() {
		search = '';
		debouncedSearch = '';
		status = 'all';
		from = defaultFrom;
		to = today;
	}

	const statusFilters: { id: StatusFilter; label: string }[] = [
		{ id: 'all', label: 'All' },
		{ id: 'picked_up', label: 'Handed over' },
		{ id: 'rejected', label: 'Rejected' },
		{ id: 'cancelled', label: 'Cancelled' }
	];
</script>

<svelte:head><title>Previous Orders - Blinca</title></svelte:head>

<PageHeader title="Previous Orders" description="Every finished order. Tap one to see the full details." />

<div class="filters">
	<div class="search">
		<SearchInput bind:value={search} label="Search orders" placeholder="Search by order number or customer" />
	</div>
	<div class="chips" role="group" aria-label="Filter by status">
		{#each statusFilters as filter (filter.id)}
			<Chip selected={status === filter.id} onclick={() => (status = filter.id)}>{filter.label}</Chip>
		{/each}
	</div>
	<div class="dates">
		<div class="field">
			<label class="field-label" for="from-date">From</label>
			<input id="from-date" class="input" type="date" bind:value={from} max={to || undefined} />
		</div>
		<div class="field">
			<label class="field-label" for="to-date">To</label>
			<input
				id="to-date"
				class="input"
				type="date"
				bind:value={to}
				min={from || undefined}
				max={today}
				aria-invalid={!!dateError}
				aria-describedby={dateError ? 'date-error' : undefined}
			/>
		</div>
		{#if hasFilters}
			<Button variant="link" size="sm" onclick={clearFilters}>Clear filters</Button>
		{/if}
	</div>
	{#if dateError}<p id="date-error" class="field-error">{dateError}</p>{/if}
</div>

<DataTable
	caption="Previous orders"
	{columns}
	rows={orders}
	rowKey={(order) => order.id}
	rowHref={(order) => `?order=${order.id}`}
	rowLabel={(order) => `Open order ${formatSerial(order.serialNo)} from ${order.customerName}`}
	{loading}
	{error}
	errorWhat="your previous orders"
	onretry={() => load(true)}
	skeletonRows={8}
>
	{#snippet cell(order, column)}
		{#if column.key === 'placedAt'}
			<span class="time">
				{formatDate(order.placedAt)}
				<span class="muted">{formatTime(order.placedAt)}</span>
			</span>
		{:else if column.key === 'serial'}
			<span class="serial">{formatSerial(order.serialNo)}</span>
		{:else if column.key === 'customer'}
			{order.customerName}
		{:else if column.key === 'type'}
			{FULFILLMENT_META[order.fulfillment].label}
		{:else if column.key === 'status'}
			<span class="status">
				<StatusBadge status={order.status} />
				{#if order.refundStatus}<span class="muted caption">{REFUND_LABELS[order.refundStatus]}</span>{/if}
			</span>
		{:else if column.key === 'total'}
			<span class:struck={order.status !== 'picked_up'}>{formatMoney(order.total)}</span>
		{/if}
	{/snippet}

	{#snippet empty()}
		{#if hasFilters}
			<EmptyState icon={SearchX} title="No orders match" description="Try a different search, status or date range.">
				{#snippet action()}
					<Button variant="secondary" onclick={clearFilters}>Clear filters</Button>
				{/snippet}
			</EmptyState>
		{:else}
			<EmptyState icon={Receipt} title="No previous orders yet" description="Finished orders will show up here." />
		{/if}
	{/snippet}
</DataTable>

{#if !loading && !error && !isDone}
	<div class="more">
		<Button variant="secondary" loading={loadingMore} onclick={() => load(false)}>Load more</Button>
	</div>
{/if}

<style>
	.filters {
		display: flex;
		flex-wrap: wrap;
		align-items: flex-end;
		gap: var(--space-2) var(--space-3);
		margin-bottom: var(--space-3);
	}

	.search {
		flex: 1 1 280px;
		max-width: 420px;
	}

	.chips {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-1);
		padding-bottom: 6px;
	}

	.dates {
		display: flex;
		align-items: flex-end;
		gap: var(--space-1);
	}

	.dates .input {
		width: 168px;
	}

	.dates > :global(.link) {
		height: var(--control-height);
	}

	.filters > .field-error {
		flex-basis: 100%;
		margin-top: calc(var(--space-1) * -1);
	}

	.time {
		display: inline-flex;
		gap: var(--space-1);
		white-space: nowrap;
	}

	.serial {
		color: var(--color-action);
	}

	.status {
		display: inline-flex;
		flex-direction: column;
		align-items: flex-start;
		gap: var(--space-half);
	}

	.caption {
		font-size: var(--text-caption);
		line-height: var(--lh-caption);
		letter-spacing: var(--ls-caption);
	}

	/* Rejected and cancelled orders are refunded: their amount didn't count. */
	.struck {
		color: var(--color-text-muted);
		text-decoration: line-through;
	}

	.more {
		display: flex;
		justify-content: center;
		margin-top: var(--space-3);
	}

	@media (max-width: 767px) {
		.search {
			max-width: none;
			flex-basis: 100%;
		}

		.dates {
			flex-wrap: wrap;
			width: 100%;
		}

		.dates .field {
			flex: 1;
		}

		.dates .input {
			width: 100%;
		}
	}
</style>
