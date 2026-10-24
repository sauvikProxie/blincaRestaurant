<script lang="ts">
	import Ban from '@lucide/svelte/icons/ban';
	import CircleCheckBig from '@lucide/svelte/icons/circle-check-big';
	import Clock from '@lucide/svelte/icons/clock';
	import Coins from '@lucide/svelte/icons/coins';
	import Flame from '@lucide/svelte/icons/flame';
	import Hourglass from '@lucide/svelte/icons/hourglass';
	import Lock from '@lucide/svelte/icons/lock';
	import PackageX from '@lucide/svelte/icons/package-x';
	import Pause from '@lucide/svelte/icons/pause';
	import Receipt from '@lucide/svelte/icons/receipt';
	import Store from '@lucide/svelte/icons/store';
	import Timer from '@lucide/svelte/icons/timer';
	import TimerOff from '@lucide/svelte/icons/timer-off';
	import Zap from '@lucide/svelte/icons/zap';
	import { REJECT_REASON_LABELS } from '$lib/components/orders/status-meta';
	import Chip from '$lib/components/ui/Chip.svelte';
	import ErrorState from '$lib/components/ui/ErrorState.svelte';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';
	import PageHeader from '$lib/components/ui/PageHeader.svelte';
	import StatCard from '$lib/components/ui/StatCard.svelte';
	import { errorCode } from '$lib/convex/errors';
	import { statsService } from '$lib/services';
	import { Resource } from '$lib/stores/resource.svelte';
	import type { AnyRejectReason } from '$lib/types';
	import { formatISODate, formatMoney } from '$lib/utils/format';
	import { addDays, businessDate } from '$lib/utils/stockholm-time';

	type RangeId = 'today' | 'week' | 'month';

	const RANGES: { id: RangeId; label: string; days: number }[] = [
		{ id: 'today', label: 'Today', days: 1 },
		{ id: 'week', label: 'Last 7 days', days: 7 },
		{ id: 'month', label: 'Last 30 days', days: 30 }
	];

	let rangeId = $state<RangeId>('today');
	const range = $derived(RANGES.find((r) => r.id === rangeId) ?? RANGES[0]);

	/** Business days start at 04:00 Stockholm time. */
	const report = new Resource(() => {
		const to = businessDate(Date.now());
		return statsService.performance(addDays(to, -(range.days - 1)), to);
	});

	$effect(() => {
		void rangeId;
		report.load();
	});

	const r = $derived(report.data);
	const loading = $derived(report.loading || !r);
	const forbidden = $derived(errorCode(report.error) === 'FORBIDDEN');

	const percent = (value: number | null) => (value === null ? '–' : `${Math.round(value * 100)}%`);
	const number = (value: number | null, unit = '') => (value === null ? '–' : `${value}${unit}`);
	const seconds = (value: number | null) => {
		if (value === null) return '–';
		const s = Math.round(value);
		return s < 60 ? `${s} s` : `${Math.floor(s / 60)} min ${s % 60} s`;
	};
	const hoursAndMinutes = (minutes: number) => {
		const h = Math.floor(minutes / 60);
		const m = Math.round(minutes % 60);
		return h ? `${h} h ${m} min` : `${m} min`;
	};
	/** Known reject reasons get their label; cancel reasons are staff's own words. */
	const reasonLabel = (reason: string) =>
		REJECT_REASON_LABELS[reason as AnyRejectReason] ?? reason.replace(/_/g, ' ');
</script>

<svelte:head><title>Performance - Blinca</title></svelte:head>

<PageHeader title="Performance" description="How reliably the kitchen takes and finishes orders.">
	{#snippet actions()}
		<div class="ranges" role="group" aria-label="Period">
			{#each RANGES as option (option.id)}
				<Chip selected={rangeId === option.id} onclick={() => (rangeId = option.id)}>{option.label}</Chip>
			{/each}
		</div>
	{/snippet}
</PageHeader>

{#snippet reasons(title: string, rows: { reason: string; count: number }[])}
	<section class="panel" aria-label={title}>
		<h3 class="panel-title">{title}</h3>
		{#if rows.length}
			<ul class="reasons">
				{#each rows as row (row.reason)}
					<li><span>{reasonLabel(row.reason)}</span><span class="count">{row.count}</span></li>
				{/each}
			</ul>
		{:else}
			<p class="muted none">None</p>
		{/if}
	</section>
{/snippet}

{#if forbidden}
	<div class="panel">
		<EmptyState icon={Lock} title="For managers and owners" description="Ask a manager if you need to see performance." />
	</div>
{:else if report.error}
	<div class="panel"><ErrorState what="your performance" onretry={() => report.load()} /></div>
{:else}
	{#if r?.coveredFrom}
		<p class="notice">
			Very busy period: order figures cover {formatISODate(r.coveredFrom)} onwards. Open, paused and busy time cover
			the whole period.
		</p>
	{/if}

	<section class="group" aria-labelledby="acceptance-title">
		<h2 id="acceptance-title" class="text-h2">Taking orders</h2>
		<div class="stats">
			<StatCard label="Paid orders" icon={Receipt} {loading} value={r ? String(r.paidOrders) : ''} />
			<StatCard
				label="Accepted"
				icon={CircleCheckBig}
				{loading}
				value={r ? percent(r.acceptanceRate) : ''}
				detail={r ? `${r.acceptedOrders} of ${r.paidOrders} orders` : undefined}
			/>
			<StatCard
				label="Missed"
				icon={TimerOff}
				{loading}
				value={r ? String(r.autoRejected) : ''}
				detail="Not accepted in time"
			/>
			<StatCard
				label="Accepted automatically"
				icon={Zap}
				{loading}
				value={r ? String(r.autoAccepted) : ''}
			/>
			<StatCard
				label="Time to accept"
				icon={Hourglass}
				{loading}
				value={r ? seconds(r.acceptSeconds.median) : ''}
				detail={r ? `Median. Average ${seconds(r.acceptSeconds.average)}` : undefined}
			/>
		</div>
		{#if r}{@render reasons('Rejected, by reason', r.rejectedByReason)}{/if}
	</section>

	<section class="group" aria-labelledby="prep-title">
		<h2 id="prep-title" class="text-h2">Prep time</h2>
		<div class="stats">
			<StatCard
				label="Ready late"
				icon={Clock}
				{loading}
				value={r ? percent(r.lateShare) : ''}
				detail="More than 2 min after the promised time"
			/>
			<StatCard
				label="Average lateness"
				icon={Timer}
				{loading}
				value={r ? number(r.averageMinutesLate, ' min') : ''}
				detail="For orders that were late"
			/>
			<StatCard
				label="Promised / actual"
				icon={Timer}
				{loading}
				value={r ? `${number(r.promisedPrepMinutes)} / ${number(r.actualPrepMinutes)} min` : ''}
				detail="Average prep time"
			/>
		</div>
	</section>

	<section class="group" aria-labelledby="cancel-title">
		<h2 id="cancel-title" class="text-h2">Cancellations</h2>
		<div class="stats">
			<StatCard
				label="Cancelled after accepting"
				icon={Ban}
				{loading}
				value={r ? String(r.cancelledAfterAccept) : ''}
			/>
			<StatCard label="Refunded" icon={Coins} {loading} value={r ? formatMoney(r.refunded) : ''} />
		</div>
		{#if r}{@render reasons('Cancelled, by reason', r.cancelledByReason)}{/if}
	</section>

	<section class="group" aria-labelledby="availability-title">
		<h2 id="availability-title" class="text-h2">Availability</h2>
		<div class="stats">
			<StatCard label="Open" icon={Store} {loading} value={r ? hoursAndMinutes(r.openMinutes) : ''} />
			<StatCard
				label="Paused while open"
				icon={Pause}
				{loading}
				value={r ? hoursAndMinutes(r.pausedMinutes) : ''}
			/>
			<StatCard label="Busy while open" icon={Flame} {loading} value={r ? hoursAndMinutes(r.busyMinutes) : ''} />
			<StatCard
				label="Sold out now"
				icon={PackageX}
				{loading}
				value={r ? `${r.soldOutItems} / ${r.soldOutOptions}` : ''}
				detail="Items / options"
			/>
		</div>
	</section>
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

	.group {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
		margin-bottom: var(--space-5);
	}

	.stats {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
		gap: var(--space-2);
	}

	.panel {
		padding: var(--space-3);
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-card);
	}

	.panel-title {
		margin-bottom: var(--space-1);
		font-size: var(--text-body);
	}

	.reasons {
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.reasons li {
		display: flex;
		justify-content: space-between;
		gap: var(--space-2);
		padding: var(--space-1) 0;
		border-bottom: 1px solid var(--color-border);
	}

	.reasons li:last-child {
		border-bottom: 0;
	}

	.count {
		font-variant-numeric: tabular-nums;
	}

	.none {
		font-size: var(--text-caption);
		letter-spacing: var(--ls-caption);
	}
</style>
