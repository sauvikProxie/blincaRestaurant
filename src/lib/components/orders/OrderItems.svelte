<script lang="ts">
	import StickyNote from '@lucide/svelte/icons/sticky-note';
	import type { OrderItem } from '$lib/types';
	import { formatMoney } from '$lib/utils/format';
	import { lineTotal } from '$lib/utils/order-totals';

	let { items }: { items: OrderItem[] } = $props();
</script>

<ul class="items">
	{#each items as item (item.productId)}
		<li>
			<span class="qty">{item.quantity} x</span>
			<div class="info">
				<p>{item.name}</p>
				<p class="unit">{formatMoney(item.unitPrice)} each</p>
				{#if item.notes}
					<p class="notes">
						<StickyNote size={16} strokeWidth={2} aria-hidden="true" />
						<span><span class="visually-hidden">Note: </span>{item.notes}</span>
					</p>
				{/if}
			</div>
			<span class="line">{formatMoney(lineTotal(item))}</span>
		</li>
	{/each}
</ul>

<style>
	.items {
		margin: 0;
		padding: 0;
		list-style: none;
	}

	li {
		display: grid;
		grid-template-columns: 40px 1fr auto;
		gap: var(--space-1);
		padding: var(--space-2) 0;
		border-bottom: 1px solid var(--color-border);
	}

	li:first-child {
		padding-top: 0;
	}

	.qty {
		color: var(--color-action);
	}

	.info {
		display: flex;
		flex-direction: column;
		gap: var(--space-half);
		min-width: 0;
	}

	.unit {
		color: var(--color-text-muted);
		font-size: var(--text-caption);
		letter-spacing: var(--ls-caption);
	}

	.notes {
		display: inline-flex;
		align-items: flex-start;
		gap: var(--space-1);
		margin-top: var(--space-half);
		padding: var(--space-1) var(--space-2) var(--space-1) var(--space-1);
		border-radius: var(--radius-sm);
		background: var(--color-tint);
		color: var(--color-text);
		font-size: var(--text-caption);
		line-height: var(--lh-caption);
		letter-spacing: var(--ls-caption);
	}

	.notes :global(svg) {
		flex: none;
		color: var(--color-action);
	}

	.line {
		white-space: nowrap;
		font-variant-numeric: tabular-nums;
	}
</style>
