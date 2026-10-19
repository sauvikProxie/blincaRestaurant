<script lang="ts">
	import Ban from '@lucide/svelte/icons/ban';
	import ChartColumn from '@lucide/svelte/icons/chart-column';
	import CircleX from '@lucide/svelte/icons/circle-x';
	import Coins from '@lucide/svelte/icons/coins';
	import Lock from '@lucide/svelte/icons/lock';
	import Receipt from '@lucide/svelte/icons/receipt';
	import Timer from '@lucide/svelte/icons/timer';
	import DailyOrdersChart from '$lib/components/performance/DailyOrdersChart.svelte';
	import Chip from '$lib/components/ui/Chip.svelte';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';
	import ErrorState from '$lib/components/ui/ErrorState.svelte';
	import PageHeader from '$lib/components/ui/PageHeader.svelte';
	import Skeleton from '$lib/components/ui/Skeleton.svelte';
	import StatCard from '$lib/components/ui/StatCard.svelte';
	import { errorCode } from '$lib/convex/errors';
	import { statsService } from '$lib/services';
	import { Resource } from '$lib/stores/resource.svelte';
	import type { SalesSummary } from '$lib/types';
	import { formatISODate, formatMoney } from '$lib/utils/format';
	import { trend } from '$lib/utils/performance';
	import { addDays, businessDate } from '$lib/utils/stockholm-time';

	type RangeId = 'today' | 'week' | 'month';

	const RANGES: { id: RangeId; label: string; days: number; comparedTo: string }[] = [
		{ id: 'today', label: 'Today', days: 1, comparedTo: 'vs yesterday' },
		{ id: 'week', label: 'Last 7 days', days: 7, comparedTo: 'vs the 7 days before' },
		{ id: 'month', label: 'Last 30 days', days: 30, comparedTo: 'vs the 30 days before' }
	];

	let rangeId = $state<RangeId>('today');
	const range = $derived(RANGES.find((r) => r.id === rangeId) ?? RANGES[0]);

	/** This range and the one just before it, so every number has a trend. Business days start at 04:00. */
	const report = new Resource(async () => {
		const to = businessDate(Date.now());
		const from = addDays(to, -(range.days - 1));
		const [current, previous] = await Promise.all([
			statsService.salesSummary(from, to),
			statsService.salesSummary(addDays(from, -range.days), addDays(from, -1))
		]);
		return { current, previous };
	});

	$effect(() => {
		void rangeId;
		report.load();
	});

	const current = $derived(report.data?.current);
	const previous = $derived(report.data?.previous);
	const loading = $derived(report.loading || !current || !previous);
	const forbidden = $derived(errorCode(report.error) === 'FORBIDDEN');

	/** Orders the kitchen took on and kept: rejected and cancelled ones don't count. */
	const kept = (s: SalesSummary) => s.daily.reduce((sum, day) => sum + day.orders, 0);
	const percent = (rate: number) => `${Math.round(rate * 100)}%`;
</script>

<svelte:head><title>Sales - Blinca</title></svelte:head>

<PageHeader title="Sales" description="How the kitchen is doing. Amounts include VAT.">
	{#snippet actions()}
		<div class="ranges" role="group" aria-label="Period">
			{#each RANGES as option (option.id)}
				<Chip selected={rangeId === option.id} onclick={() => (rangeId = option.id)}>{option.label}</Chip>
			{/each}
		</div>
	{/snippet}
</PageHeader>

{#if forbidden}
	<div class="panel">
		<EmptyState icon={Lock} title="For managers and owners" description="Ask a manager if you need to see sales." />
	</div>
{:else if report.error}
	<div class="panel"><ErrorState what="your sales" onretry={() => report.load()} /></div>
{:else}
	{#if current?.coveredFrom}
		<p class="notice">Very busy period: these totals cover {formatISODate(current.coveredFrom)} onwards.</p>
	{/if}

	<div class="stats">
		<StatCard
			label="Revenue"
			icon={Coins}
			{loading}
			value={current ? formatMoney(current.revenue) : ''}
			trend={current && previous ? trend(current.revenue, previous.revenue, 'higher') : null}
			comparedTo={range.comparedTo}
		/>
		<StatCard
			label="Orders"
			icon={Receipt}
			{loading}
			value={current ? String(kept(current)) : ''}
			trend={current && previous ? trend(kept(current), kept(previous), 'higher') : null}
			comparedTo={range.comparedTo}
		/>
		<StatCard
			label="Average order"
			icon={ChartColumn}
			{loading}
			value={current ? formatMoney(current.averageOrder) : ''}
			trend={current && previous ? trend(current.averageOrder, previous.averageOrder, 'higher') : null}
			comparedTo={range.comparedTo}
		/>
		<StatCard
			label="Rejected"
			icon={CircleX}
			{loading}
			value={current ? String(current.rejectedCount) : ''}
			detail={current?.orderCount ? `${percent(current.rejectionRate)} of orders` : undefined}
			trend={current && previous ? trend(current.rejectedCount, previous.rejectedCount, 'lower') : null}
			comparedTo={range.comparedTo}
		/>
		<StatCard
			label="Average prep time"
			icon={Timer}
			{loading}
			value={current ? (current.averagePrepMinutes === null ? 'No data yet' : `${current.averagePrepMinutes} min`) : ''}
			detail="From accepting to ready"
			trend={current?.averagePrepMinutes != null && previous?.averagePrepMinutes != null
				? trend(current.averagePrepMinutes, previous.averagePrepMinutes, 'lower')
				: null}
			comparedTo={range.comparedTo}
		/>
	</div>

	<div class="panels">
		{#if range.days > 1}
			<section class="panel padded" aria-labelledby="chart-title">
				<h2 id="chart-title" class="panel-title">Orders per day</h2>
				<p class="muted panel-sub">Hover a day for details.</p>
				{#if loading}
					<Skeleton height="200px" radius="card" />
				{:else if current && kept(current) > 0}
					<DailyOrdersChart days={current.daily} />
				{:else}
					<EmptyState icon={Receipt} title="No orders in this period" description="Once orders come in, you'll see each day here." />
				{/if}
			</section>
		{/if}

		<section class="panel padded" aria-labelledby="top-title">
			<h2 id="top-title" class="panel-title">Best sellers</h2>
			{#if loading}
				<Skeleton height="160px" radius="card" />
			{:else if current?.topProducts.length}
				<ol class="top">
					{#each current.topProducts as product, index (product.name)}
						<li>
							<span class="rank">{index + 1}</span>
							<span class="name">{product.name}</span>
							<span class="qty">{product.quantity} sold</span>
							<span class="amount">{formatMoney(product.revenue)}</span>
						</li>
					{/each}
				</ol>
			{:else}
				<EmptyState icon={Ban} title="Nothing sold yet" description="Your best sellers will show up here." />
			{/if}
		</section>
	</div>
{/if}

<style>
	.ranges {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-1);
	}

	.notice {
		margin-bottom: var(--space-2);
		color: var(--color-text-muted);
		font-size: var(--text-caption);
		letter-spacing: var(--ls-caption);
	}

	.stats {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
		gap: var(--space-2);
		margin-bottom: var(--space-3);
	}

	.panels {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(min(100%, 360px), 1fr));
		gap: var(--space-3);
	}

	.panel {
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-card);
	}

	.padded {
		padding: var(--space-3);
	}

	.panel-title {
		margin-bottom: var(--space-2);
		font-size: var(--text-body);
	}

	.panel-sub {
		margin-top: calc(var(--space-2) * -1);
		margin-bottom: var(--space-2);
		font-size: var(--text-caption);
		letter-spacing: var(--ls-caption);
	}

	.top {
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.top li {
		display: grid;
		grid-template-columns: 28px 1fr auto auto;
		align-items: baseline;
		gap: var(--space-2);
		padding: var(--space-1) 0;
		border-bottom: 1px solid var(--color-border);
	}

	.top li:last-child {
		border-bottom: 0;
	}

	.rank {
		color: var(--color-action);
	}

	.name {
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.qty {
		color: var(--color-text-muted);
		font-size: var(--text-caption);
		letter-spacing: var(--ls-caption);
	}

	.amount {
		font-variant-numeric: tabular-nums;
		white-space: nowrap;
	}
</style>
