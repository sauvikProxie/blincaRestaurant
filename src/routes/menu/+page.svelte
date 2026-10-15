<script lang="ts">
	import CircleCheckBig from '@lucide/svelte/icons/circle-check-big';
	import SearchX from '@lucide/svelte/icons/search-x';
	import UtensilsCrossed from '@lucide/svelte/icons/utensils-crossed';
	import { onMount } from 'svelte';
	import ProductCard from '$lib/components/menu/ProductCard.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';
	import ErrorState from '$lib/components/ui/ErrorState.svelte';
	import PageHeader from '$lib/components/ui/PageHeader.svelte';
	import SearchInput from '$lib/components/ui/SearchInput.svelte';
	import Skeleton from '$lib/components/ui/Skeleton.svelte';
	import Tabs from '$lib/components/ui/Tabs.svelte';
	import { menuService } from '$lib/services';
	import { Resource } from '$lib/stores/resource.svelte';
	import { toasts } from '$lib/stores/toasts.svelte';
	import type { Product } from '$lib/types';

	type Tab = 'all' | 'unavailable';

	const products = new Resource(() => menuService.list());
	let tab = $state<Tab>('all');
	let search = $state('');
	let busy = $state<string[]>([]);

	onMount(() => {
		products.load();
	});

	const all = $derived(products.data ?? []);
	const unavailableCount = $derived(all.filter((p) => !p.isAvailable).length);

	const visible = $derived.by(() => {
		const term = search.trim().toLowerCase();
		return all.filter(
			(p) =>
				(tab === 'all' || !p.isAvailable) &&
				(!term || p.name.toLowerCase().includes(term) || p.category.toLowerCase().includes(term))
		);
	});

	/** Visible products grouped by category, keeping the menu's category order. */
	const groups = $derived.by(() => {
		const categories = visible.map((p) => p.category).filter((c, i, all) => all.indexOf(c) === i);
		return categories.map((category) => [category, visible.filter((p) => p.category === category)] as const);
	});

	function patch(id: string, isAvailable: boolean) {
		if (products.data) products.data = products.data.map((p) => (p.id === id ? { ...p, isAvailable } : p));
	}

	/** Instant (optimistic) change, with Undo in the toast. */
	async function setAvailability(product: Product, isAvailable: boolean, offerUndo = true) {
		patch(product.id, isAvailable);
		busy = [...busy, product.id];
		try {
			await menuService.setAvailability(product.id, isAvailable);
			const message = isAvailable
				? `${product.name} is back on the menu.`
				: `${product.name} is now unavailable. Customers won't see it.`;
			const undo = { label: 'Undo', run: () => setAvailability(product, !isAvailable, false) };
			toasts.success(message, offerUndo ? undo : undefined);
		} catch {
			patch(product.id, !isAvailable);
			toasts.error(`Sorry, we couldn't update ${product.name}. Please try again.`);
		} finally {
			busy = busy.filter((id) => id !== product.id);
		}
	}
</script>

<svelte:head><title>Menu - Blinca</title></svelte:head>

<PageHeader title="Menu" description="Run out of something? Switch it off and customers stop seeing it straight away." />

<div class="toolbar">
	<Tabs
		label="Products"
		idPrefix="menu"
		value={tab}
		onchange={(value) => (tab = value)}
		tabs={[
			{ id: 'all', label: 'All Products', count: products.data ? all.length : undefined },
			{ id: 'unavailable', label: 'Unavailable Products', count: products.data ? unavailableCount : undefined }
		]}
	/>
	<div class="search">
		<SearchInput bind:value={search} label="Search the menu" placeholder="Search dishes" />
	</div>
</div>

<div id="menu-panel" role="tabpanel" aria-labelledby="menu-tab-{tab}">
	{#if products.error}
		<div class="panel"><ErrorState what="your menu" onretry={() => products.load()} /></div>
	{:else if products.loading && !products.data}
		<div class="grid" aria-busy="true">
			{#each { length: 6 } as _, i (i)}
				<div class="skeleton-card">
					<Skeleton width="72px" height="72px" radius="card" />
					<div class="skeleton-text">
						<Skeleton width="60%" height="18px" />
						<Skeleton width="90%" height="12px" />
						<Skeleton width="30%" height="14px" />
					</div>
				</div>
			{/each}
		</div>
	{:else if groups.length === 0}
		<div class="panel">
			{#if search.trim()}
				<EmptyState icon={SearchX} title="No dishes match" description="Try another name or category.">
					{#snippet action()}
						<Button variant="secondary" onclick={() => (search = '')}>Clear search</Button>
					{/snippet}
				</EmptyState>
			{:else if tab === 'unavailable'}
				<EmptyState
					icon={CircleCheckBig}
					title="All products are available"
					description="Everything on your menu can be ordered right now."
				/>
			{:else}
				<EmptyState icon={UtensilsCrossed} title="Your menu is empty" description="Dishes you add will show up here." />
			{/if}
		</div>
	{:else}
		{#each groups as [category, items] (category)}
			<section class="category" aria-labelledby="cat-{category}">
				<h2 id="cat-{category}" class="category-title">
					{category} <span class="muted">{items.length}</span>
				</h2>
				<div class="grid">
					{#each items as product (product.id)}
						<ProductCard
							{product}
							busy={busy.includes(product.id)}
							onavailability={(isAvailable) => setAvailability(product, isAvailable)}
						/>
					{/each}
				</div>
			</section>
		{/each}
	{/if}
</div>

<style>
	.toolbar {
		display: flex;
		align-items: flex-end;
		justify-content: space-between;
		flex-wrap: wrap;
		gap: var(--space-2);
		margin-bottom: var(--space-4);
	}

	.search {
		flex: 0 1 320px;
		margin-bottom: var(--space-1);
	}

	.category {
		margin-bottom: var(--space-5);
	}

	.category-title {
		margin-bottom: var(--space-2);
		font-size: var(--text-h2);
		line-height: var(--lh-h2);
		letter-spacing: var(--ls-h2);
	}

	.category-title .muted {
		font-size: var(--text-body);
		letter-spacing: 0;
	}

	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
		gap: var(--space-2);
	}

	.panel {
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-card);
	}

	.skeleton-card {
		display: flex;
		gap: var(--space-2);
		padding: var(--space-2);
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-card);
	}

	.skeleton-text {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
	}

	@media (max-width: 767px) {
		.search {
			flex-basis: 100%;
		}

		.grid {
			grid-template-columns: 1fr;
		}
	}
</style>
