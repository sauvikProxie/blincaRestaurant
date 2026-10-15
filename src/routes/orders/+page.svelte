<script lang="ts">
	import Receipt from '@lucide/svelte/icons/receipt';
	import SearchX from '@lucide/svelte/icons/search-x';
	import Button from '$lib/components/ui/Button.svelte';
	import Chip from '$lib/components/ui/Chip.svelte';
	import DataTable, { type Column, type SortState } from '$lib/components/ui/DataTable.svelte';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';
	import PageHeader from '$lib/components/ui/PageHeader.svelte';
	import Pagination from '$lib/components/ui/Pagination.svelte';
	import SearchInput from '$lib/components/ui/SearchInput.svelte';
	import StatusBadge from '$lib/components/ui/StatusBadge.svelte';
	import { appConfig } from '$lib/config/app.config';
	import { ordersService } from '$lib/services';
	import { Resource } from '$lib/stores/resource.svelte';
	import type { PastOrdersQuery } from '$lib/types';
	import { formatDate, formatMoney, formatSerial, formatTime } from '$lib/utils/format';

	type StatusFilter = 'all' | 'delivered' | 'cancelled';

	const columns: Column[] = [
		{ key: 'placedAt', label: 'Time', sortable: true },
		{ key: 'serial', label: '#Serial No' },
		{ key: 'customer', label: 'Customer' },
		{ key: 'status', label: 'Status' },
		{ key: 'total', label: 'Amount', align: 'end', sortable: true }
	];

	let search = $state('');
	let debouncedSearch = $state('');
	let status = $state<StatusFilter>('all');
	let from = $state('');
	let to = $state('');
	let sort = $state<SortState>({ key: 'placedAt', dir: 'desc' });
	let page = $state(1);

	const query = $derived<PastOrdersQuery>({
		search: debouncedSearch || undefined,
		status: status === 'all' ? undefined : status,
		from: from || undefined,
		to: to || undefined,
		sortBy: sort.key === 'total' ? 'total' : 'placedAt',
		sortDir: sort.dir,
		page,
		pageSize: appConfig.orders.pageSize
	});

	const hasFilters = $derived(!!(debouncedSearch || status !== 'all' || from || to));
	const dateError = $derived(from && to && to < from ? 'End date must be on or after the start date' : '');

	const orders = new Resource(() => ordersService.listPast(query));

	$effect(() => {
		const value = search.trim();
		const timer = setTimeout(() => (debouncedSearch = value), 250);
		return () => clearTimeout(timer);
	});

	// Any filter change starts again from page 1.
	$effect(() => {
		void [debouncedSearch, status, from, to, sort.key, sort.dir];
		page = 1;
	});

	$effect(() => {
		if (dateError) return;
		void query;
		orders.load();
	});

	function clearFilters() {
		search = '';
		debouncedSearch = '';
		status = 'all';
		from = '';
		to = '';
	}

	const statusFilters: { id: StatusFilter; label: string }[] = [
		{ id: 'all', label: 'All' },
		{ id: 'delivered', label: 'Delivered' },
		{ id: 'cancelled', label: 'Cancelled' }
	];
</script>

<svelte:head><title>Previous Orders - Blinca</title></svelte:head>

<PageHeader title="Previous Orders" description="Every delivered and cancelled order. Tap one to see the full details." />

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
	rows={orders.data?.items ?? []}
	rowKey={(order) => order.id}
	rowHref={(order) => `?order=${order.id}`}
	rowLabel={(order) => `Open order ${formatSerial(order.serialNo)} from ${order.customer.name}`}
	loading={orders.loading}
	error={orders.error}
	errorWhat="your previous orders"
	onretry={() => orders.load()}
	{sort}
	onsort={(next) => (sort = next)}
	skeletonRows={appConfig.orders.pageSize}
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
			{order.customer.name}
		{:else if column.key === 'status'}
			<StatusBadge status={order.status} />
		{:else if column.key === 'total'}
			<span class:cancelled={order.status === 'cancelled'}>{formatMoney(order.total)}</span>
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
			<EmptyState
				icon={Receipt}
				title="No previous orders yet"
				description="Delivered and cancelled orders will show up here."
			/>
		{/if}
	{/snippet}
</DataTable>

{#if orders.data && orders.data.total > 0 && !orders.error}
	<div class="pagination">
		<Pagination page={orders.data.page} pageSize={orders.data.pageSize} total={orders.data.total} onchange={(p) => (page = p)} />
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

	.cancelled {
		color: var(--color-text-muted);
		text-decoration: line-through;
	}

	.pagination {
		margin-top: var(--space-2);
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
