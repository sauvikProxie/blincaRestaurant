<script lang="ts">
	import type { LucideIcon } from '@lucide/svelte';
	import type { HTMLButtonAttributes } from 'svelte/elements';

	interface Props extends Omit<HTMLButtonAttributes, 'children'> {
		label: string;
		icon: LucideIcon;
		/** outline: thin Ink-tint ring, like the call button in the brand UI. */
		variant?: 'plain' | 'outline';
	}

	let { label, icon: Icon, variant = 'plain', type = 'button', ...rest }: Props = $props();
</script>

<button {type} class="icon-btn {variant}" aria-label={label} title={label} {...rest}>
	<Icon size={22} strokeWidth={2} aria-hidden="true" />
</button>

<style>
	.icon-btn {
		display: inline-grid;
		place-items: center;
		flex: none;
		width: 44px;
		height: 44px;
		border-radius: 50%;
		border: 1px solid transparent;
		background: transparent;
		color: var(--color-text);
		transition: background-color var(--duration) var(--ease);
	}

	.icon-btn:hover:not(:disabled) {
		background: var(--color-tint);
	}

	.icon-btn:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	.outline {
		border-color: var(--color-border-strong);
		background: var(--color-surface);
	}
</style>
