<script lang="ts">
	import CircleCheck from '@lucide/svelte/icons/circle-check';
	import Info from '@lucide/svelte/icons/info';
	import TriangleAlert from '@lucide/svelte/icons/triangle-alert';
	import X from '@lucide/svelte/icons/x';
	import { toasts } from '$lib/stores/toasts.svelte';

	const icons = { default: Info, success: CircleCheck, error: TriangleAlert };
</script>

<div class="toaster" role="status" aria-live="polite">
	{#each toasts.items as toast (toast.id)}
		{@const Icon = icons[toast.tone]}
		<div class="toast {toast.tone}">
			<Icon size={20} strokeWidth={2} aria-hidden="true" />
			<p>{toast.message}</p>
			{#if toast.action}
				<button
					type="button"
					class="action"
					onclick={() => {
						toast.action?.run();
						toasts.dismiss(toast.id);
					}}>{toast.action.label}</button
				>
			{/if}
			<button type="button" class="close" aria-label="Dismiss" onclick={() => toasts.dismiss(toast.id)}>
				<X size={18} strokeWidth={2} aria-hidden="true" />
			</button>
		</div>
	{/each}
</div>

<style>
	.toaster {
		position: fixed;
		z-index: var(--z-toast);
		bottom: calc(var(--space-3) + var(--safe-bottom));
		left: 50%;
		transform: translateX(-50%);
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
		width: min(100% - 2 * var(--space-2), 480px);
		pointer-events: none;
	}

	/* Ink surface so toasts read on any page background */
	.toast {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		padding: var(--space-2) var(--space-1) var(--space-2) var(--space-2);
		border-radius: var(--radius-card);
		background: var(--color-dark);
		color: var(--color-text-inverse);
		pointer-events: auto;
		animation: pop var(--duration) var(--ease);
	}

	.toast.error {
		background: var(--color-action);
	}

	p {
		flex: 1;
		font-size: var(--text-caption);
		line-height: var(--lh-caption);
		letter-spacing: var(--ls-caption);
	}

	.action {
		border: 0;
		background: none;
		color: var(--color-text-inverse);
		text-decoration: underline;
		text-underline-offset: 4px;
		padding: var(--space-1);
		border-radius: var(--radius-sm);
	}

	.close {
		display: grid;
		place-items: center;
		width: 36px;
		height: 36px;
		border: 0;
		border-radius: 50%;
		background: none;
		color: inherit;
		opacity: 0.8;
	}

	.close:hover,
	.action:hover {
		background: color-mix(in srgb, var(--color-white) 14%, transparent);
	}

	@keyframes pop {
		from {
			opacity: 0;
			transform: translateY(12px);
		}
	}
</style>
