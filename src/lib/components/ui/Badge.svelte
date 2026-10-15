<script lang="ts" module>
	export type BadgeTone =
		| 'action'
		| 'action-outline'
		| 'tint'
		| 'dark'
		| 'dark-outline'
		| 'muted'
		| 'muted-outline';
</script>

<script lang="ts">
	import type { LucideIcon } from '@lucide/svelte';
	import type { Snippet } from 'svelte';

	interface Props {
		tone?: BadgeTone;
		icon?: LucideIcon;
		/** Small status dot instead of an icon. */
		dot?: boolean;
		size?: 'sm' | 'md';
		children: Snippet;
	}

	let { tone = 'tint', icon: Icon, dot = false, size = 'sm', children }: Props = $props();
</script>

<span class="badge {tone} {size}">
	{#if Icon}
		<Icon size={size === 'sm' ? 14 : 16} strokeWidth={2} aria-hidden="true" />
	{:else if dot}
		<span class="dot" aria-hidden="true"></span>
	{/if}
	{@render children()}
</span>

<style>
	.badge {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		border-radius: var(--radius-pill);
		border: 1px solid transparent;
		white-space: nowrap;
		font-size: var(--text-caption);
		line-height: var(--lh-caption);
		letter-spacing: var(--ls-caption);
	}

	.sm {
		height: 28px;
		padding: 0 10px;
	}

	.md {
		height: 36px;
		padding: 0 var(--space-2);
	}

	.dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: currentColor;
	}

	.action {
		background: var(--color-action);
		color: var(--color-text-inverse);
	}

	.action-outline {
		background: var(--color-surface);
		border-color: var(--color-action);
		color: var(--color-action);
	}

	.tint {
		background: var(--color-tint);
		color: var(--color-action);
	}

	.dark {
		background: var(--color-dark);
		color: var(--color-text-inverse);
	}

	.dark-outline {
		background: var(--color-surface);
		border-color: var(--color-dark);
		color: var(--color-text);
	}

	.muted {
		background: var(--color-stone-tint);
		color: var(--color-text);
	}

	.muted-outline {
		background: transparent;
		border-color: var(--color-border-strong);
		color: var(--color-text-muted);
	}
</style>
