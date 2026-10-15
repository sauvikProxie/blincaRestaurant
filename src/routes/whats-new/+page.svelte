<script lang="ts">
	import Sparkles from '@lucide/svelte/icons/sparkles';
	import { onMount } from 'svelte';
	import GuideCard from '$lib/components/guides/GuideCard.svelte';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';
	import ErrorState from '$lib/components/ui/ErrorState.svelte';
	import PageHeader from '$lib/components/ui/PageHeader.svelte';
	import Skeleton from '$lib/components/ui/Skeleton.svelte';
	import { guidesService } from '$lib/services';
	import { Resource } from '$lib/stores/resource.svelte';

	const guides = new Resource(() => guidesService.list());
	let expanded = $state<string[]>([]);

	onMount(async () => {
		await guides.load();
		// Open the first guide so the steps are easy to discover.
		const first = guides.data?.[0];
		if (first) expanded = [first.id];
	});

	function toggle(id: string) {
		expanded = expanded.includes(id) ? expanded.filter((e) => e !== id) : [...expanded, id];
	}
</script>

<svelte:head><title>What's New - Blinca</title></svelte:head>

<PageHeader
	title="What's New"
	description="Quick guides to everything in Blinca for restaurants. Each one takes about a minute."
/>

{#if guides.error}
	<div class="panel"><ErrorState what="the guides" onretry={() => guides.load()} /></div>
{:else if guides.loading && !guides.data}
	<div class="list" aria-busy="true">
		{#each { length: 4 } as _, i (i)}<Skeleton height="132px" radius="card" />{/each}
	</div>
{:else if !guides.data?.length}
	<div class="panel">
		<EmptyState icon={Sparkles} title="Nothing new right now" description="We'll post guides here when something changes." />
	</div>
{:else}
	<div class="list">
		{#each guides.data as guide (guide.id)}
			<GuideCard {guide} expanded={expanded.includes(guide.id)} ontoggle={() => toggle(guide.id)} />
		{/each}
	</div>
{/if}

<style>
	.list {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
		max-width: 880px;
	}

	.panel {
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-card);
	}
</style>
