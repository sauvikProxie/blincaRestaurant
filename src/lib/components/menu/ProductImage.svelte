<script lang="ts">
	import type { LucideIcon } from '@lucide/svelte';
	import CakeSlice from '@lucide/svelte/icons/cake-slice';
	import CupSoda from '@lucide/svelte/icons/cup-soda';
	import Hamburger from '@lucide/svelte/icons/hamburger';
	import Pizza from '@lucide/svelte/icons/pizza';
	import Salad from '@lucide/svelte/icons/salad';
	import Soup from '@lucide/svelte/icons/soup';
	import UtensilsCrossed from '@lucide/svelte/icons/utensils-crossed';
	import type { Product } from '$lib/types';

	let { product }: { product: Pick<Product, 'image' | 'name' | 'category'> } = $props();

	const CATEGORY_ICONS: Record<string, LucideIcon> = {
		Starters: Soup,
		'Wood-fired pizza': Pizza,
		Mains: Hamburger,
		Sides: Salad,
		Desserts: CakeSlice,
		Drinks: CupSoda
	};

	const Icon = $derived(CATEGORY_ICONS[product.category] ?? UtensilsCrossed);
</script>

{#if product.image}
	<img class="image" src={product.image} alt={product.name} loading="lazy" />
{:else}
	<!-- Placeholder until real food photography is uploaded -->
	<span class="image placeholder" aria-hidden="true"><Icon size={28} strokeWidth={2} /></span>
{/if}

<style>
	.image {
		display: grid;
		place-items: center;
		flex: none;
		width: 72px;
		height: 72px;
		border-radius: var(--radius-card);
		object-fit: cover;
	}

	.placeholder {
		background: var(--color-tint);
		color: var(--color-primary);
	}
</style>
