<script lang="ts">
	import type { OrderDetail } from '$lib/types';
	import { formatMoney, formatPercentRate } from '$lib/utils/format';

	/** Amounts exactly as the backend charged them. Prices include VAT, as on a Swedish receipt. */
	let { order }: { order: Pick<OrderDetail, 'subtotal' | 'discount' | 'deliveryFee' | 'total' | 'vat'> } = $props();
</script>

<dl class="breakdown">
	<div class="row">
		<dt>Subtotal</dt>
		<dd>{formatMoney(order.subtotal)}</dd>
	</div>
	{#if order.discount > 0}
		<div class="row">
			<dt>Discount</dt>
			<dd class="discount">-{formatMoney(order.discount)}</dd>
		</div>
	{/if}
	{#if order.deliveryFee > 0}
		<div class="row">
			<dt>Delivery fee</dt>
			<dd>{formatMoney(order.deliveryFee)}</dd>
		</div>
	{/if}
	<div class="row total">
		<dt>Total</dt>
		<dd class="text-h2">{formatMoney(order.total)}</dd>
	</div>
	{#each order.vat as row (row.rate)}
		<div class="row vat">
			<dt>Of which VAT ({formatPercentRate(row.rate)})</dt>
			<dd>{formatMoney(row.amount)}</dd>
		</div>
	{/each}
</dl>

<style>
	.breakdown {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
		margin: 0;
	}

	.row {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		gap: var(--space-2);
	}

	dt {
		color: var(--color-text-muted);
	}

	dd {
		margin: 0;
		white-space: nowrap;
		font-variant-numeric: tabular-nums;
	}

	.discount {
		color: var(--color-action);
	}

	/* Emphasis by size and colour, never bold */
	.total {
		align-items: center;
		margin-top: var(--space-1);
		padding-top: var(--space-2);
		border-top: 1px solid var(--color-border);
	}

	.total dt {
		color: var(--color-text);
	}

	.vat {
		font-size: var(--text-caption);
		line-height: var(--lh-caption);
		letter-spacing: var(--ls-caption);
	}

	.vat dd {
		color: var(--color-text-muted);
	}
</style>
