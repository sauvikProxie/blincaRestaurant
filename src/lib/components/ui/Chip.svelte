<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		selected?: boolean;
		count?: number;
		onclick: () => void;
		children: Snippet;
	}

	let { selected = false, count, onclick, children }: Props = $props();
</script>

<button type="button" class="chip" aria-pressed={selected} {onclick}>
	{@render children()}
	{#if count !== undefined}<span class="count">{count}</span>{/if}
</button>

<style>
	/* Filter chips (08 Interface): pills, Blush with a Cranberry edge when selected */
	.chip {
		display: inline-flex;
		align-items: center;
		gap: var(--space-1);
		height: var(--control-height-sm);
		padding: 0 var(--space-2);
		border-radius: var(--radius-pill);
		border: 1px solid var(--color-border-strong);
		background: var(--color-surface);
		white-space: nowrap;
		transition:
			background-color var(--duration) var(--ease),
			border-color var(--duration) var(--ease);
	}

	.chip:hover {
		background: var(--color-hover);
	}

	.chip[aria-pressed='true'] {
		background: var(--color-tint);
		border-color: var(--color-primary);
		color: var(--color-action);
	}

	.count {
		font-size: var(--text-caption);
		color: var(--color-text-muted);
	}

	[aria-pressed='true'] .count {
		color: var(--color-action);
	}
</style>
