<script lang="ts">
	import { appConfig } from '$lib/config/app.config';
	import type { Order } from '$lib/types';
	import { formatMoney, formatPercentRate } from '$lib/utils/format';
	import { calculateOrderTotals } from '$lib/utils/order-totals';

	let { order }: { order: Pick<Order, 'items' | 'discount' | 'discountLabel' | 'deliveryFee'> } = $props();

	// Always recalculated from the items, never read from stored totals.
	const totals = $derived(
		calculateOrderTotals({
			items: order.items,
			discount: order.discount,
			deliveryFee: order.deliveryFee,
			vatRate: appConfig.vatRate
		})
	);
</script>

<dl class="breakdown">
	<div class="row">
		<dt>Subtotal</dt>
		<dd>{formatMoney(totals.subtotal)}</dd>
	</div>
	<div class="row">
		<dt>
			Discount
			<span class="note">{totals.discount > 0 && order.discountLabel ? order.discountLabel : 'No offer used'}</span>
		</dt>
		<dd class:discount={totals.discount > 0}>
			{totals.discount > 0 ? `-${formatMoney(totals.discount)}` : formatMoney(0)}
		</dd>
	</div>
	<div class="row">
		<dt>VAT ({formatPercentRate(appConfig.vatRate)})</dt>
		<dd>{formatMoney(totals.vat)}</dd>
	</div>
	<div class="row">
		<dt>Delivery fee</dt>
		<dd>{formatMoney(totals.deliveryFee)}</dd>
	</div>
	<div class="row total">
		<dt>Total</dt>
		<dd class="text-h2">{formatMoney(totals.total)}</dd>
	</div>
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
		display: flex;
		flex-direction: column;
		color: var(--color-text-muted);
	}

	dd {
		margin: 0;
		white-space: nowrap;
		font-variant-numeric: tabular-nums;
	}

	.note {
		font-size: var(--text-caption);
		line-height: var(--lh-caption);
		letter-spacing: var(--ls-caption);
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
</style>
