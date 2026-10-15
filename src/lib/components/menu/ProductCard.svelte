<script lang="ts">
	import Badge from '$lib/components/ui/Badge.svelte';
	import Toggle from '$lib/components/ui/Toggle.svelte';
	import type { Product } from '$lib/types';
	import { formatMoney } from '$lib/utils/format';
	import ProductImage from './ProductImage.svelte';

	interface Props {
		product: Product;
		busy?: boolean;
		onavailability: (isAvailable: boolean) => void;
	}

	let { product, busy = false, onavailability }: Props = $props();
</script>

<article class="product" class:unavailable={!product.isAvailable}>
	<ProductImage {product} />
	<div class="info">
		<h3 class="name">{product.name}</h3>
		<p class="description">{product.description}</p>
		<p class="price">{formatMoney(product.price, { whole: true })}</p>
	</div>
	<div class="availability">
		<Toggle
			checked={product.isAvailable}
			label="{product.name} available"
			hideLabel
			disabled={busy}
			onchange={onavailability}
		/>
		{#if product.isAvailable}
			<span class="state">Available</span>
		{:else}
			<Badge tone="muted-outline">Unavailable</Badge>
		{/if}
	</div>
</article>

<style>
	.product {
		display: flex;
		align-items: flex-start;
		gap: var(--space-2);
		padding: var(--space-2);
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-card);
		transition: background-color var(--duration) var(--ease);
	}

	.info {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: var(--space-half);
	}

	.name {
		font-size: var(--text-body);
		line-height: var(--lh-body);
	}

	.description {
		color: var(--color-text-muted);
		font-size: var(--text-caption);
		line-height: var(--lh-caption);
		letter-spacing: var(--ls-caption);
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.price {
		margin-top: var(--space-half);
		color: var(--color-action);
	}

	.availability {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: var(--space-1);
		min-width: 96px;
	}

	.state {
		color: var(--color-text-muted);
		font-size: var(--text-caption);
		letter-spacing: var(--ls-caption);
	}

	.unavailable {
		background: var(--color-bg);
	}

	.unavailable :global(.image),
	.unavailable .info {
		opacity: 0.6;
	}

	.unavailable .price {
		color: var(--color-text-muted);
	}
</style>
