<script lang="ts" generics="T extends string">
	interface Tab {
		id: T;
		label: string;
		count?: number;
	}

	interface Props {
		tabs: Tab[];
		value: T;
		label: string;
		/** id prefix tying each tab to its panel (panel id: `${idPrefix}-panel`). */
		idPrefix: string;
		onchange: (value: T) => void;
	}

	let { tabs, value, label, idPrefix, onchange }: Props = $props();

	let buttons: HTMLButtonElement[] = $state([]);

	function onkeydown(event: KeyboardEvent, index: number) {
		const delta = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
		if (!delta) return;
		event.preventDefault();
		const next = (index + delta + tabs.length) % tabs.length;
		onchange(tabs[next].id);
		buttons[next]?.focus();
	}
</script>

<div class="tabs" role="tablist" aria-label={label}>
	{#each tabs as tab, index (tab.id)}
		<button
			bind:this={buttons[index]}
			type="button"
			role="tab"
			id="{idPrefix}-tab-{tab.id}"
			aria-selected={tab.id === value}
			aria-controls="{idPrefix}-panel"
			tabindex={tab.id === value ? 0 : -1}
			onclick={() => onchange(tab.id)}
			onkeydown={(e) => onkeydown(e, index)}
		>
			{tab.label}
			{#if tab.count !== undefined}<span class="count">{tab.count}</span>{/if}
		</button>
	{/each}
</div>

<style>
	.tabs {
		display: flex;
		gap: var(--space-3);
		border-bottom: 1px solid var(--color-border);
		overflow-x: auto;
		scrollbar-width: none;
	}

	button {
		position: relative;
		display: inline-flex;
		align-items: center;
		gap: var(--space-1);
		height: var(--control-height);
		padding: 0;
		border: 0;
		background: none;
		color: var(--color-text-muted);
		white-space: nowrap;
		transition: color var(--duration) var(--ease);
	}

	button:hover {
		color: var(--color-text);
	}

	button[aria-selected='true'] {
		color: var(--color-text);
	}

	button[aria-selected='true']::after {
		content: '';
		position: absolute;
		left: 0;
		right: 0;
		bottom: -1px;
		height: 3px;
		border-radius: var(--radius-pill);
		background: var(--color-primary);
	}

	.count {
		display: inline-grid;
		place-items: center;
		min-width: 24px;
		height: 24px;
		padding: 0 var(--space-1);
		border-radius: var(--radius-pill);
		background: var(--color-stone-tint);
		color: var(--color-text);
		font-size: var(--text-caption);
	}

	[aria-selected='true'] .count {
		background: var(--color-tint);
		color: var(--color-action);
	}
</style>
