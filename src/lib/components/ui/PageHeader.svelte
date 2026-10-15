<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		title: string;
		description?: string;
		actions?: Snippet;
	}

	let { title, description, actions }: Props = $props();
</script>

<header class="page-header">
	<div class="text">
		<h1 class="text-h1">{title}</h1>
		{#if description}<p class="muted">{description}</p>{/if}
	</div>
	{#if actions}<div class="actions">{@render actions()}</div>{/if}
</header>

<style>
	.page-header {
		display: flex;
		align-items: flex-end;
		justify-content: space-between;
		flex-wrap: wrap;
		gap: var(--space-2) var(--space-3);
		margin-bottom: var(--space-4);
	}

	.text {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
		max-width: 60ch;
	}

	h1 {
		color: var(--color-text);
	}

	.actions {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-1);
	}
</style>
