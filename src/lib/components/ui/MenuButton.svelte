<script lang="ts">
	import type { LucideIcon } from '@lucide/svelte';

	interface Props {
		label: string;
		icon?: LucideIcon;
		items: { label: string; onselect: () => void }[];
		disabled?: boolean;
	}

	let { label, icon: Icon, items, disabled = false }: Props = $props();

	let open = $state(false);
	let root = $state<HTMLDivElement>();
	let trigger = $state<HTMLButtonElement>();
	const menuId = `menu-${Math.random().toString(36).slice(2, 8)}`;

	function close(focusTrigger = false) {
		open = false;
		if (focusTrigger) trigger?.focus();
	}

	function onWindowClick(event: MouseEvent) {
		if (open && root && !root.contains(event.target as Node)) close();
	}

	function onMenuKeydown(event: KeyboardEvent) {
		const buttons = [...(root?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]') ?? [])];
		const index = buttons.indexOf(document.activeElement as HTMLButtonElement);
		if (event.key === 'Escape') close(true);
		if (event.key === 'ArrowDown') buttons[(index + 1) % buttons.length]?.focus();
		if (event.key === 'ArrowUp') buttons[(index - 1 + buttons.length) % buttons.length]?.focus();
		if (['ArrowDown', 'ArrowUp', 'Escape'].includes(event.key)) event.preventDefault();
	}

	$effect(() => {
		if (open) root?.querySelector<HTMLButtonElement>('[role="menuitem"]')?.focus();
	});
</script>

<svelte:window onclick={onWindowClick} />

<div class="menu-button" bind:this={root}>
	<button
		bind:this={trigger}
		type="button"
		class="trigger"
		aria-haspopup="menu"
		aria-expanded={open}
		aria-controls={menuId}
		{disabled}
		onclick={() => (open = !open)}
	>
		{#if Icon}<Icon size={18} strokeWidth={2} aria-hidden="true" />{/if}
		{label}
	</button>
	{#if open}
		<div class="menu" id={menuId} role="menu" tabindex="-1" onkeydown={onMenuKeydown}>
			{#each items as item (item.label)}
				<button
					type="button"
					role="menuitem"
					onclick={() => {
						item.onselect();
						close(true);
					}}>{item.label}</button
				>
			{/each}
		</div>
	{/if}
</div>

<style>
	.menu-button {
		position: relative;
	}

	.trigger {
		display: inline-flex;
		align-items: center;
		gap: var(--space-1);
		height: var(--control-height-sm);
		padding: 0 var(--space-2);
		border: 0;
		border-radius: var(--radius-pill);
		background: none;
		color: var(--color-action);
		font-size: var(--text-caption);
		letter-spacing: var(--ls-caption);
		white-space: nowrap;
	}

	.trigger:hover:not(:disabled),
	.trigger[aria-expanded='true'] {
		background: var(--color-tint);
	}

	.trigger:disabled {
		color: var(--color-text-muted);
		cursor: not-allowed;
	}

	.menu {
		position: absolute;
		right: 0;
		top: calc(100% + var(--space-half));
		z-index: 10;
		display: flex;
		flex-direction: column;
		min-width: 200px;
		padding: var(--space-1);
		border-radius: var(--radius-card);
		border: 1px solid var(--color-border);
		background: var(--color-surface);
		box-shadow: 0 8px 24px color-mix(in srgb, var(--color-dark) 12%, transparent);
	}

	[role='menuitem'] {
		height: 44px;
		padding: 0 var(--space-2);
		border: 0;
		border-radius: var(--radius-sm);
		background: none;
		text-align: left;
		white-space: nowrap;
	}

	[role='menuitem']:hover,
	[role='menuitem']:focus-visible {
		background: var(--color-tint);
		outline: none;
	}
</style>
