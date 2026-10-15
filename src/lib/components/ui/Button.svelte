<script lang="ts">
	import type { LucideIcon } from '@lucide/svelte';
	import type { Snippet } from 'svelte';
	import type { HTMLButtonAttributes } from 'svelte/elements';

	interface Props extends Omit<HTMLButtonAttributes, 'children'> {
		/** primary: filled Cranberry Deep. secondary: Ink outline. ghost: quiet. link: text link. inverse: on Cranberry. */
		variant?: 'primary' | 'secondary' | 'ghost' | 'link' | 'inverse';
		size?: 'md' | 'sm';
		href?: string;
		icon?: LucideIcon;
		loading?: boolean;
		fullWidth?: boolean;
		children: Snippet;
	}

	let {
		variant = 'primary',
		size = 'md',
		href,
		icon: Icon,
		loading = false,
		fullWidth = false,
		type = 'button',
		disabled,
		children,
		...rest
	}: Props = $props();
</script>

{#snippet content()}
	{#if loading}
		<span class="spinner" aria-hidden="true"></span>
	{:else if Icon}
		<Icon size={size === 'sm' ? 18 : 20} strokeWidth={2} aria-hidden="true" />
	{/if}
	<span>{@render children()}</span>
{/snippet}

{#if href}
	<a {href} class="btn {variant} {size}" class:full={fullWidth}>{@render content()}</a>
{:else}
	<button
		{type}
		class="btn {variant} {size}"
		class:full={fullWidth}
		disabled={disabled || loading}
		aria-busy={loading || undefined}
		{...rest}
	>
		{@render content()}
	</button>
{/if}

<style>
	.btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: var(--space-1);
		height: var(--control-height);
		padding: 0 var(--space-3);
		border-radius: var(--radius-pill);
		border: 1px solid transparent;
		font-size: var(--text-body);
		line-height: 1;
		text-decoration: none;
		white-space: nowrap;
		transition:
			background-color var(--duration) var(--ease),
			border-color var(--duration) var(--ease),
			color var(--duration) var(--ease),
			transform var(--duration) var(--ease);
	}

	.btn:active:not(:disabled) {
		transform: scale(0.98);
	}

	.btn:disabled {
		cursor: not-allowed;
		opacity: 0.5;
	}

	.sm {
		height: var(--control-height-sm);
		padding: 0 var(--space-2);
		font-size: var(--text-caption);
		letter-spacing: var(--ls-caption);
	}

	.full {
		width: 100%;
	}

	/* White on Cranberry Deep: 6.6:1, safe for small text */
	.primary {
		background: var(--color-action);
		color: var(--color-text-inverse);
	}

	.primary:hover:not(:disabled) {
		background: color-mix(in srgb, var(--color-action) 88%, var(--color-dark));
	}

	.secondary {
		background: var(--color-surface);
		border-color: var(--color-dark);
		color: var(--color-text);
	}

	.secondary:hover:not(:disabled) {
		background: var(--color-hover);
	}

	.ghost {
		background: transparent;
		color: var(--color-text);
	}

	.ghost:hover:not(:disabled) {
		background: var(--color-tint);
	}

	.link {
		background: transparent;
		color: var(--color-action);
		text-decoration: underline;
		text-underline-offset: 4px;
		padding: 0 var(--space-1);
	}

	.link:hover:not(:disabled) {
		color: var(--color-text);
	}

	.inverse {
		background: var(--color-surface);
		color: var(--color-action);
	}

	.inverse:hover:not(:disabled) {
		background: var(--color-tint);
	}

	.spinner {
		width: 18px;
		height: 18px;
		border-radius: 50%;
		border: 2px solid currentColor;
		border-right-color: transparent;
		animation: spin 700ms linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
</style>
