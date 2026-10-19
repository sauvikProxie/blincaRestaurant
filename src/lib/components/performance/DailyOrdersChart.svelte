<script lang="ts">
	import type { SalesSummary } from '$lib/types';
	import { formatISODate, formatMoney, pluralize } from '$lib/utils/format';

	/** One bar per business day: paid orders the kitchen took on. */
	let { days }: { days: SalesSummary['daily'] } = $props();

	const HEIGHT = 200;
	const PAD = { top: 12, right: 8, bottom: 28, left: 32 };
	const MAX_BAR = 24;
	const RADIUS = 4;

	let width = $state(0);
	let hovered = $state<number | null>(null);

	const plotWidth = $derived(Math.max(0, width - PAD.left - PAD.right));
	const plotHeight = HEIGHT - PAD.top - PAD.bottom;
	const band = $derived(days.length ? plotWidth / days.length : 0);
	/** Bars never fill their slot: capped at 24 px with at least a 2 px surface gap. */
	const barWidth = $derived(Math.max(2, Math.min(MAX_BAR, band - 2)));

	/** Clean y ticks: 4 steps of a whole number. */
	const ticks = $derived.by(() => {
		const max = Math.max(1, ...days.map((d) => d.orders));
		const step = Math.max(1, Math.ceil(max / 4));
		return [0, 1, 2, 3, 4].map((i) => i * step);
	});
	const yMax = $derived(ticks.at(-1) ?? 1);
	const y = (value: number) => PAD.top + plotHeight - (value / yMax) * plotHeight;

	/** Column with a 4 px rounded top, square at the baseline. */
	function barPath(index: number, value: number): string {
		const x = PAD.left + index * band + (band - barWidth) / 2;
		const top = y(value);
		const base = y(0);
		const r = Math.min(RADIUS, barWidth / 2, base - top);
		return `M${x},${base} V${top + r} Q${x},${top} ${x + r},${top} H${x + barWidth - r} Q${x + barWidth},${top} ${x + barWidth},${top + r} V${base} Z`;
	}

	const showLabel = (index: number) => index === 0 || (index + 1) % 5 === 0;
	const active = $derived(hovered === null ? null : days[hovered]);
</script>

<figure class="chart">
	<div class="plot" bind:clientWidth={width}>
		{#if width > 0}
			<svg {width} height={HEIGHT} role="img" aria-label="Orders per day, bar chart. Full numbers in the table below.">
				{#each ticks as tick (tick)}
					<line class="grid" x1={PAD.left} x2={width - PAD.right} y1={y(tick)} y2={y(tick)} />
					<text class="axis" x={PAD.left - 8} y={y(tick)} dy="0.32em" text-anchor="end">{tick}</text>
				{/each}

				{#each days as day, i (day.date)}
					{#if day.orders > 0}
						<path class="bar" class:dim={hovered !== null && hovered !== i} d={barPath(i, day.orders)} />
					{/if}
					{#if showLabel(i)}
						<text class="axis" x={PAD.left + i * band + band / 2} y={HEIGHT - 8} text-anchor="middle">
							{formatISODate(day.date, 'd')}
						</text>
					{/if}
					<!-- Hit target: the whole band, bigger than the bar -->
					<rect
						class="hit"
						x={PAD.left + i * band}
						y={PAD.top}
						width={band}
						height={plotHeight}
						role="presentation"
						onmouseenter={() => (hovered = i)}
						onmouseleave={() => (hovered = null)}
					/>
				{/each}
			</svg>

			{#if active && hovered !== null}
				<div
					class="tooltip"
					style:left="{Math.min(Math.max(PAD.left + hovered * band + band / 2, 80), width - 80)}px"
					style:top="{y(active.orders) - 8}px"
				>
					<p class="tip-date">{formatISODate(active.date, 'EEE d MMM')}</p>
					<p><span class="key" aria-hidden="true"></span>{pluralize(active.orders, 'order')}</p>
					<p class="muted">{formatMoney(active.revenue)}</p>
				</div>
			{/if}
		{/if}
	</div>

	<!-- Hidden on a wrapper: tables ignore the 1 px size, so a hidden table would still stretch the page -->
	<div class="visually-hidden">
		<table>
			<caption>Orders and revenue per day</caption>
			<thead><tr><th scope="col">Day</th><th scope="col">Orders</th><th scope="col">Revenue</th></tr></thead>
			<tbody>
				{#each days as day (day.date)}
					<tr><th scope="row">{formatISODate(day.date, 'd MMM')}</th><td>{day.orders}</td><td>{formatMoney(day.revenue)}</td></tr>
				{/each}
			</tbody>
		</table>
	</div>
</figure>

<style>
	.chart {
		margin: 0;
	}

	.plot {
		position: relative;
		width: 100%;
		min-height: 200px;
	}

	svg {
		display: block;
		overflow: visible;
	}

	/* Recessive: hairline, solid, one step off the surface */
	.grid {
		stroke: var(--color-border);
		stroke-width: 1;
	}

	.axis {
		fill: var(--color-text-muted);
		font-size: 12px;
		font-family: var(--font);
	}

	.bar {
		fill: var(--color-primary);
		transition: opacity var(--duration) var(--ease);
	}

	.bar.dim {
		opacity: 0.35;
	}

	.hit {
		fill: transparent;
	}

	.tooltip {
		position: absolute;
		transform: translate(-50%, -100%);
		padding: var(--space-1) var(--space-2);
		border-radius: var(--radius-sm);
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		box-shadow: 0 4px 16px color-mix(in srgb, var(--color-dark) 12%, transparent);
		font-size: var(--text-caption);
		line-height: var(--lh-caption);
		letter-spacing: var(--ls-caption);
		white-space: nowrap;
		pointer-events: none;
	}

	.tip-date {
		color: var(--color-text-muted);
	}

	.tooltip p {
		display: flex;
		align-items: center;
		gap: 6px;
	}

	.key {
		width: 8px;
		height: 8px;
		border-radius: 2px;
		background: var(--color-primary);
	}
</style>
