<script lang="ts">
	import Plus from '@lucide/svelte/icons/plus';
	import TicketPercent from '@lucide/svelte/icons/ticket-percent';
	import { onMount } from 'svelte';
	import DiscountCard from '$lib/components/discounts/DiscountCard.svelte';
	import DiscountForm from '$lib/components/discounts/DiscountForm.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Chip from '$lib/components/ui/Chip.svelte';
	import ConfirmDialog from '$lib/components/ui/ConfirmDialog.svelte';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';
	import ErrorState from '$lib/components/ui/ErrorState.svelte';
	import PageHeader from '$lib/components/ui/PageHeader.svelte';
	import Skeleton from '$lib/components/ui/Skeleton.svelte';
	import { discountsService } from '$lib/services';
	import { clock } from '$lib/stores/clock.svelte';
	import { Resource } from '$lib/stores/resource.svelte';
	import { toasts } from '$lib/stores/toasts.svelte';
	import type { Discount, DiscountInput } from '$lib/types';
	import { getDiscountPhase } from '$lib/utils/discounts';

	type Filter = 'all' | 'active' | 'scheduled' | 'expired' | 'paused';

	const discounts = new Resource(() => discountsService.list());
	let filter = $state<Filter>('all');
	let editing = $state<Discount | null>(null);
	let formOpen = $state(false);
	let saving = $state(false);
	let deleting = $state<Discount | null>(null);
	let removing = $state(false);
	let busy = $state<string[]>([]);

	onMount(() => {
		discounts.load();
	});

	const withPhase = $derived(
		(discounts.data ?? []).map((discount) => ({ discount, phase: getDiscountPhase(discount, clock.now) }))
	);

	const matches: Record<Filter, (item: (typeof withPhase)[number]) => boolean> = {
		all: () => true,
		active: ({ discount, phase }) => phase === 'live' && discount.isActive,
		scheduled: ({ phase }) => phase === 'scheduled',
		expired: ({ phase }) => phase === 'expired',
		paused: ({ discount, phase }) => phase !== 'expired' && !discount.isActive
	};

	const FILTERS: { id: Filter; label: string }[] = [
		{ id: 'all', label: 'All' },
		{ id: 'active', label: 'Active' },
		{ id: 'scheduled', label: 'Scheduled' },
		{ id: 'expired', label: 'Expired' },
		{ id: 'paused', label: 'Paused' }
	];

	const visible = $derived(withPhase.filter(matches[filter]));

	function replace(updated: Discount) {
		if (discounts.data) discounts.data = discounts.data.map((d) => (d.id === updated.id ? updated : d));
	}

	function openCreate() {
		editing = null;
		formOpen = true;
	}

	function openEdit(discount: Discount) {
		editing = discount;
		formOpen = true;
	}

	async function save(input: DiscountInput) {
		saving = true;
		try {
			if (editing) {
				replace(await discountsService.update(editing.id, input));
				toasts.success(`Saved. "${input.title}" is up to date.`);
			} else {
				const created = await discountsService.create(input);
				discounts.data = [created, ...(discounts.data ?? [])];
				toasts.success(`"${created.title}" is ready.`);
			}
			formOpen = false;
		} catch {
			toasts.error("Sorry, we couldn't save that discount. Please try again.");
		} finally {
			saving = false;
		}
	}

	async function toggle(discount: Discount, isActive: boolean) {
		busy = [...busy, discount.id];
		replace({ ...discount, isActive });
		try {
			const { id, ...input } = discount;
			replace(await discountsService.update(id, { ...input, isActive }));
			toasts.success(isActive ? `"${discount.title}" is switched on.` : `"${discount.title}" is paused.`);
		} catch {
			replace(discount);
			toasts.error("Sorry, we couldn't change that discount. Please try again.");
		} finally {
			busy = busy.filter((id) => id !== discount.id);
		}
	}

	async function confirmDelete() {
		if (!deleting) return;
		removing = true;
		try {
			await discountsService.remove(deleting.id);
			discounts.data = (discounts.data ?? []).filter((d) => d.id !== deleting?.id);
			toasts.success(`"${deleting.title}" was deleted.`);
			deleting = null;
		} catch {
			toasts.error("Sorry, we couldn't delete that discount. Please try again.");
		} finally {
			removing = false;
		}
	}
</script>

<svelte:head><title>Discounts - Blinca</title></svelte:head>

<PageHeader title="Discounts" description="Offers that bring hungry customers your way. Switch them on and off any time.">
	{#snippet actions()}
		<Button icon={Plus} onclick={openCreate}>Create discount</Button>
	{/snippet}
</PageHeader>

<div class="filters" role="group" aria-label="Filter discounts">
	{#each FILTERS as item (item.id)}
		<Chip
			selected={filter === item.id}
			count={discounts.data ? withPhase.filter(matches[item.id]).length : undefined}
			onclick={() => (filter = item.id)}>{item.label}</Chip
		>
	{/each}
</div>

{#if discounts.error}
	<div class="panel"><ErrorState what="your discounts" onretry={() => discounts.load()} /></div>
{:else if discounts.loading && !discounts.data}
	<div class="grid" aria-busy="true">
		{#each { length: 4 } as _, i (i)}<Skeleton height="220px" radius="card" />{/each}
	</div>
{:else if visible.length === 0}
	<div class="panel">
		<EmptyState
			icon={TicketPercent}
			title={filter === 'all' ? 'No discounts yet' : `No ${filter} discounts`}
			description={filter === 'all'
				? 'Create your first offer to bring in more orders.'
				: 'Try another filter, or create a new offer.'}
		>
			{#snippet action()}
				<Button icon={Plus} onclick={openCreate}>Create discount</Button>
			{/snippet}
		</EmptyState>
	</div>
{:else}
	<div class="grid">
		{#each visible as { discount, phase } (discount.id)}
			<DiscountCard
				{discount}
				{phase}
				busy={busy.includes(discount.id)}
				ontoggle={(isActive) => toggle(discount, isActive)}
				onedit={() => openEdit(discount)}
				ondelete={() => (deleting = discount)}
			/>
		{/each}
	</div>
{/if}

<DiscountForm open={formOpen} discount={editing} {saving} onsave={save} onclose={() => (formOpen = false)} />

<ConfirmDialog
	open={!!deleting}
	title="Delete this discount?"
	body={`"${deleting?.title ?? ''}" stops applying straight away. This can't be undone.`}
	confirmLabel="Delete discount"
	cancelLabel="Keep it"
	busy={removing}
	onconfirm={confirmDelete}
	oncancel={() => (deleting = null)}
/>

<style>
	.filters {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-1);
		margin-bottom: var(--space-3);
	}

	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(min(100%, 440px), 1fr));
		gap: var(--space-3);
	}

	.panel {
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-card);
	}
</style>
