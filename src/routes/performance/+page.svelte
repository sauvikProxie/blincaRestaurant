<script lang="ts">
	import CalendarX from '@lucide/svelte/icons/calendar-x';
	import ChevronLeft from '@lucide/svelte/icons/chevron-left';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import CircleCheckBig from '@lucide/svelte/icons/circle-check-big';
	import CircleX from '@lucide/svelte/icons/circle-x';
	import Star from '@lucide/svelte/icons/star';
	import Timer from '@lucide/svelte/icons/timer';
	import { addMonths, format, isSameMonth, startOfMonth } from 'date-fns';
	import DailyOrdersChart from '$lib/components/performance/DailyOrdersChart.svelte';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';
	import ErrorState from '$lib/components/ui/ErrorState.svelte';
	import IconButton from '$lib/components/ui/IconButton.svelte';
	import PageHeader from '$lib/components/ui/PageHeader.svelte';
	import Skeleton from '$lib/components/ui/Skeleton.svelte';
	import StatCard from '$lib/components/ui/StatCard.svelte';
	import Stars from '$lib/components/ui/Stars.svelte';
	import { appConfig } from '$lib/config/app.config';
	import { performanceService } from '$lib/services';
	import { Resource } from '$lib/stores/resource.svelte';
	import { formatMonth, pluralize } from '$lib/utils/format';
	import { trend } from '$lib/utils/performance';

	/** How far back the month picker goes. */
	const MONTHS_BACK = 12;

	const thisMonth = startOfMonth(new Date());
	let month = $state(thisMonth);

	const report = new Resource(() => performanceService.getMonthlyReport(month));

	$effect(() => {
		void month;
		report.load();
	});

	const isCurrent = $derived(isSameMonth(month, thisMonth));
	const comparedTo = $derived.by(() => {
		const until = report.data?.previousUntil;
		const previousMonth = addMonths(month, -1);
		return until
			? `vs 1-${format(until, 'd MMM')}`
			: `vs ${format(previousMonth, 'MMMM')}`;
	});
	const current = $derived(report.data?.current);
	const previous = $derived(report.data?.previous);
	const hasOrders = $derived(!!current && current.delivered + current.cancelled > 0);

	const hours = (value: number) => `${Math.round(value * 10) / 10} h`;
</script>

<svelte:head><title>Team Performance - Blinca</title></svelte:head>

<PageHeader title="Team Performance" description="How your kitchen did this month, compared with the month before.">
	{#snippet actions()}
		<div class="month-picker">
			<IconButton
				label="Previous month"
				icon={ChevronLeft}
				variant="outline"
				disabled={month <= addMonths(thisMonth, -MONTHS_BACK)}
				onclick={() => (month = addMonths(month, -1))}
			/>
			<p class="month" aria-live="polite">
				{formatMonth(month)}
				{#if isCurrent}<span class="muted">Month to date</span>{/if}
			</p>
			<IconButton
				label="Next month"
				icon={ChevronRight}
				variant="outline"
				disabled={isCurrent}
				onclick={() => (month = addMonths(month, 1))}
			/>
		</div>
	{/snippet}
</PageHeader>

{#if report.error}
	<div class="panel"><ErrorState what="your performance" onretry={() => report.load()} /></div>
{:else}
	{@const loading = report.loading || !current || !previous}
	<div class="stats">
		<StatCard
			label="Delivered orders"
			icon={CircleCheckBig}
			{loading}
			value={String(current?.delivered ?? '')}
			trend={current && previous ? trend(current.delivered, previous.delivered, 'higher') : null}
			{comparedTo}
		/>
		<StatCard
			label="Cancelled orders"
			icon={CircleX}
			{loading}
			value={String(current?.cancelled ?? '')}
			trend={current && previous ? trend(current.cancelled, previous.cancelled, 'lower') : null}
			{comparedTo}
		/>
		<StatCard
			label="Delayed orders"
			icon={Timer}
			{loading}
			value={String(current?.delayed ?? '')}
			detail="Delivered more than {appConfig.orders.delayedAfterMinutes} min after ordering"
			trend={current && previous ? trend(current.delayed, previous.delayed, 'lower') : null}
			{comparedTo}
		/>
		<StatCard
			label="Order rating"
			icon={Star}
			{loading}
			value={current?.ratingAverage != null ? `${current.ratingAverage.toFixed(1)} / 5` : 'No ratings yet'}
			detail={current ? `from ${pluralize(current.ratingCount, 'rating')}` : undefined}
			trend={current?.ratingAverage != null && previous?.ratingAverage != null
				? trend(current.ratingAverage, previous.ratingAverage, 'higher')
				: null}
			{comparedTo}
		>
			{#snippet extra()}
				{#if current?.ratingAverage != null}<Stars value={current.ratingAverage} />{/if}
			{/snippet}
		</StatCard>
		<StatCard
			label="Hours missed"
			icon={CalendarX}
			{loading}
			value={current ? hours(current.hoursMissed) : ''}
			detail="Scheduled hours you were closed manually"
			trend={current && previous ? trend(current.hoursMissed, previous.hoursMissed, 'lower') : null}
			{comparedTo}
		/>
	</div>

	<section class="panel chart-panel" aria-labelledby="chart-title">
		<h2 id="chart-title" class="chart-title">Delivered orders per day</h2>
		<p class="muted chart-sub">{formatMonth(month)}. Hover a day for details.</p>
		{#if loading}
			<Skeleton height="200px" radius="card" />
		{:else if !hasOrders || !current}
			<EmptyState icon={CircleCheckBig} title="No orders this month" description="Once orders come in, you'll see each day here." />
		{:else}
			<DailyOrdersChart days={current.daily} />
		{/if}
	</section>
{/if}

<style>
	.month-picker {
		display: flex;
		align-items: center;
		gap: var(--space-2);
	}

	.month {
		display: flex;
		flex-direction: column;
		align-items: center;
		min-width: 160px;
		text-align: center;
	}

	.month .muted {
		font-size: var(--text-caption);
		line-height: var(--lh-caption);
		letter-spacing: var(--ls-caption);
	}

	.stats {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
		gap: var(--space-2);
		margin-bottom: var(--space-3);
	}

	.panel {
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-card);
	}

	.chart-panel {
		padding: var(--space-3);
	}

	.chart-title {
		font-size: var(--text-body);
	}

	.chart-sub {
		margin-bottom: var(--space-2);
		font-size: var(--text-caption);
		letter-spacing: var(--ls-caption);
	}
</style>
