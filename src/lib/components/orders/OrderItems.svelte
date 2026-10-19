<script lang="ts">
	import StickyNote from '@lucide/svelte/icons/sticky-note';
	import type { OrderLine } from '$lib/types';
	import { formatMoney } from '$lib/utils/format';

	let { lines }: { lines: OrderLine[] } = $props();
</script>

<ul class="items">
	{#each lines as line (line.id)}
		<li>
			<span class="qty">{line.quantity} x</span>
			<div class="info">
				<p>{line.name}{#if line.variantName}<span class="variant">, {line.variantName}</span>{/if}</p>
				{#if line.options.length}
					<ul class="options">
						{#each line.options as option, index (index)}
							<li>
								{option.quantity > 1 ? `${option.quantity} x ` : ''}{option.name}
								<span class="group">({option.group})</span>
							</li>
						{/each}
					</ul>
				{/if}
				<p class="unit">{formatMoney(line.unitPrice)} each</p>
				{#if line.note}
					<p class="notes">
						<StickyNote size={16} strokeWidth={2} aria-hidden="true" />
						<span><span class="visually-hidden">Note: </span>{line.note}</span>
					</p>
				{/if}
			</div>
			<span class="line">{formatMoney(line.total)}</span>
		</li>
	{/each}
</ul>

<style>
	.items {
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.items > li {
		display: grid;
		grid-template-columns: 40px 1fr auto;
		gap: var(--space-1);
		padding: var(--space-2) 0;
		border-bottom: 1px solid var(--color-border);
	}

	.items > li:first-child {
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

	.variant {
		color: var(--color-text-muted);
	}

	.options {
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.options li::before {
		content: '+ ';
		color: var(--color-action);
	}

	.group,
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
