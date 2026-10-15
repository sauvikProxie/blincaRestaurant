<script lang="ts">
	import ChevronLeft from '@lucide/svelte/icons/chevron-left';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import IconButton from './IconButton.svelte';

	interface Props {
		page: number;
		pageSize: number;
		total: number;
		onchange: (page: number) => void;
	}

	let { page, pageSize, total, onchange }: Props = $props();

	const pages = $derived(Math.max(1, Math.ceil(total / pageSize)));
	const first = $derived(total === 0 ? 0 : (page - 1) * pageSize + 1);
	const last = $derived(Math.min(page * pageSize, total));

	/** Page numbers to show, with null standing in for a gap. */
	const items = $derived.by(() => {
		const wanted = new Set([1, pages, page - 1, page, page + 1]);
		const list = [...wanted].filter((n) => n >= 1 && n <= pages).sort((a, b) => a - b);
		const result: (number | null)[] = [];
		list.forEach((n, i) => {
			if (i > 0 && n - list[i - 1] > 1) result.push(null);
			result.push(n);
		});
		return result;
	});
</script>

<nav class="pagination" aria-label="Pagination">
	<p class="summary">{first}-{last} of {total}</p>
	<div class="controls">
		<IconButton label="Previous page" icon={ChevronLeft} disabled={page <= 1} onclick={() => onchange(page - 1)} />
		{#each items as item, i (i)}
			{#if item === null}
				<span class="gap" aria-hidden="true">...</span>
			{:else}
				<button
					type="button"
					class="page"
					aria-current={item === page ? 'page' : undefined}
					aria-label="Page {item}"
					onclick={() => onchange(item)}>{item}</button
				>
			{/if}
		{/each}
		<IconButton label="Next page" icon={ChevronRight} disabled={page >= pages} onclick={() => onchange(page + 1)} />
	</div>
</nav>

<style>
	.pagination {
		display: flex;
		align-items: center;
		justify-content: space-between;
		flex-wrap: wrap;
		gap: var(--space-2);
	}

	.summary {
		color: var(--color-text-muted);
		font-size: var(--text-caption);
		letter-spacing: var(--ls-caption);
	}

	.controls {
		display: flex;
		align-items: center;
		gap: var(--space-half);
	}

	.page {
		min-width: 44px;
		height: 44px;
		padding: 0 var(--space-1);
		border: 0;
		border-radius: var(--radius-pill);
		background: none;
	}

	.page:hover {
		background: var(--color-tint);
	}

	.page[aria-current='page'] {
		background: var(--color-action);
		color: var(--color-text-inverse);
	}

	.gap {
		padding: 0 var(--space-half);
		color: var(--color-text-muted);
	}
</style>
