<script lang="ts">
	import Search from '@lucide/svelte/icons/search';
	import X from '@lucide/svelte/icons/x';

	interface Props {
		value: string;
		label: string;
		placeholder?: string;
	}

	let { value = $bindable(), label, placeholder }: Props = $props();
</script>

<div class="search">
	<Search size={20} strokeWidth={2} aria-hidden="true" />
	<input class="input" type="search" aria-label={label} {placeholder} bind:value autocomplete="off" />
	{#if value}
		<button type="button" class="clear" aria-label="Clear search" onclick={() => (value = '')}>
			<X size={18} strokeWidth={2} aria-hidden="true" />
		</button>
	{/if}
</div>

<style>
	.search {
		position: relative;
		display: flex;
		align-items: center;
		min-width: 0;
		color: var(--color-text-muted);
	}

	.search > :global(svg) {
		position: absolute;
		left: var(--space-2);
		pointer-events: none;
	}

	input {
		padding-left: calc(var(--space-2) + 28px);
		padding-right: var(--space-6);
	}

	input::-webkit-search-cancel-button {
		display: none;
	}

	.clear {
		position: absolute;
		right: var(--space-1);
		display: grid;
		place-items: center;
		width: 36px;
		height: 36px;
		border: 0;
		border-radius: 50%;
		background: none;
		color: var(--color-text-muted);
	}

	.clear:hover {
		background: var(--color-tint);
		color: var(--color-text);
	}
</style>
