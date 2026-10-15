<script lang="ts">
	import type { LucideIcon } from '@lucide/svelte';
	import type { Snippet } from 'svelte';
	import SpeedLines from './SpeedLines.svelte';

	interface Props {
		icon: LucideIcon;
		title: string;
		description?: string;
		/** Error states use the same layout with a stronger tone. */
		tone?: 'default' | 'error';
		action?: Snippet;
	}

	let { icon: Icon, title, description, tone = 'default', action }: Props = $props();
</script>

<div class="empty {tone}" role={tone === 'error' ? 'alert' : undefined}>
	<div class="art" aria-hidden="true">
		<span class="lines"><SpeedLines size="sm" /></span>
		<span class="disc"><Icon size={32} strokeWidth={2} /></span>
	</div>
	<p class="title text-h2">{title}</p>
	{#if description}<p class="description">{description}</p>{/if}
	{#if action}<div class="actions">{@render action()}</div>{/if}
</div>

<style>
	.empty {
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		gap: var(--space-1);
		padding: var(--space-6) var(--space-3);
	}

	.art {
		display: flex;
		align-items: center;
		gap: var(--space-1);
		margin-bottom: var(--space-2);
		color: var(--color-primary);
	}

	.disc {
		display: grid;
		place-items: center;
		width: 72px;
		height: 72px;
		border-radius: 50%;
		background: var(--color-tint);
		color: var(--color-primary);
	}

	.error .disc {
		background: var(--color-action);
		color: var(--color-text-inverse);
	}

	.title {
		max-width: 28ch;
	}

	.description {
		max-width: 44ch;
		color: var(--color-text-muted);
	}

	.actions {
		margin-top: var(--space-2);
		display: flex;
		gap: var(--space-1);
		flex-wrap: wrap;
		justify-content: center;
	}
</style>
