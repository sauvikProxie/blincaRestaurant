<script lang="ts">
	import type { LucideIcon } from '@lucide/svelte';
	import ArrowDown from '@lucide/svelte/icons/arrow-down';
	import ArrowUp from '@lucide/svelte/icons/arrow-up';
	import Minus from '@lucide/svelte/icons/minus';
	import type { Snippet } from 'svelte';
	import type { Trend } from '$lib/utils/performance';
	import Skeleton from './Skeleton.svelte';

	interface Props {
		label: string;
		icon: LucideIcon;
		value?: string;
		/** Caption under the value, e.g. "from 42 ratings". */
		detail?: string;
		trend?: Trend | null;
		/** Shown next to the trend, e.g. "vs September". */
		comparedTo?: string;
		loading?: boolean;
		/** Extra visual under the value, e.g. stars. */
		extra?: Snippet;
	}

	let { label, icon: Icon, value, detail, trend, comparedTo, loading = false, extra }: Props = $props();

	const trendText = $derived.by(() => {
		if (!trend) return '';
		if (trend.direction === 'flat') return 'No change';
		return trend.percent === null ? 'Up from zero' : `${trend.percent}%`;
	});
</script>

<article class="stat" aria-busy={loading}>
	<header>
		<span class="icon" aria-hidden="true"><Icon size={20} strokeWidth={2} /></span>
		<h3 class="label">{label}</h3>
	</header>

	{#if loading}
		<Skeleton width="96px" height="40px" />
		<Skeleton width="140px" height="14px" />
	{:else}
		<p class="value text-h1">{value}</p>
		{@render extra?.()}
		{#if detail}<p class="detail">{detail}</p>{/if}
		{#if trend}
			<p class="trend" class:good={trend.isGood} class:bad={!trend.isGood}>
				{#if trend.direction === 'up'}
					<ArrowUp size={16} strokeWidth={2} aria-label="Up" />
				{:else if trend.direction === 'down'}
					<ArrowDown size={16} strokeWidth={2} aria-label="Down" />
				{:else}
					<Minus size={16} strokeWidth={2} aria-hidden="true" />
				{/if}
				<span>{trendText}</span>
				{#if comparedTo}<span class="compared">{comparedTo}</span>{/if}
			</p>
		{/if}
	{/if}
</article>

<style>
	.stat {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
		padding: var(--space-3);
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-card);
		min-width: 0;
	}

	header {
		display: flex;
		align-items: center;
		gap: var(--space-1);
		margin-bottom: var(--space-1);
	}

	.icon {
		display: grid;
		place-items: center;
		width: 36px;
		height: 36px;
		border-radius: 50%;
		background: var(--color-tint);
		color: var(--color-primary);
	}

	.label {
		font-size: var(--text-body);
		color: var(--color-text-muted);
	}

	.detail {
		color: var(--color-text-muted);
		font-size: var(--text-caption);
		letter-spacing: var(--ls-caption);
	}

	.trend {
		display: inline-flex;
		align-items: center;
		flex-wrap: wrap;
		gap: var(--space-half);
		margin-top: auto;
		padding-top: var(--space-1);
		font-size: var(--text-caption);
		letter-spacing: var(--ls-caption);
	}

	/* Inside the palette: good news in Ink, bad news in Cranberry Deep */
	.good {
		color: var(--color-positive);
	}

	.bad {
		color: var(--color-negative);
	}

	.compared {
		color: var(--color-text-muted);
	}
</style>
