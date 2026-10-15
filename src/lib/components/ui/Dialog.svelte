<script lang="ts">
	import X from '@lucide/svelte/icons/x';
	import type { Snippet } from 'svelte';
	import IconButton from './IconButton.svelte';

	interface Props {
		open: boolean;
		title: string;
		/** Small line above the title, e.g. "Order". */
		eyebrow?: string;
		/** modal: centred card. drawer: side sheet (bottom sheet on phones). */
		variant: 'modal' | 'drawer';
		size?: 'sm' | 'md' | 'lg';
		onclose: () => void;
		/** Extra content next to the title, e.g. a status badge. */
		headerExtra?: Snippet;
		footer?: Snippet;
		children: Snippet;
	}

	let { open, title, eyebrow, variant, size = 'md', onclose, headerExtra, footer, children }: Props = $props();

	let dialog = $state<HTMLDialogElement>();
	const titleId = `dialog-title-${Math.random().toString(36).slice(2, 8)}`;

	$effect(() => {
		if (!dialog) return;
		if (open && !dialog.open) dialog.showModal();
		if (!open && dialog.open) dialog.close();
	});

	function handleCancel(event: Event) {
		// Esc: let the parent decide (it may want to confirm first).
		event.preventDefault();
		onclose();
	}

	function handleClick(event: MouseEvent) {
		// Clicks on the backdrop land on the dialog element itself.
		if (event.target === dialog) onclose();
	}
</script>

<!-- Backdrop clicks close it; Esc is handled by oncancel. -->
<dialog
	bind:this={dialog}
	class="{variant} {size}"
	aria-labelledby={titleId}
	oncancel={handleCancel}
	onclick={handleClick}
>
	{#if open}
		<div class="panel">
			<header>
				<div class="titles">
					{#if eyebrow}<p class="eyebrow">{eyebrow}</p>{/if}
					<div class="title-row">
						<h2 id={titleId} class="text-h2">{title}</h2>
						{@render headerExtra?.()}
					</div>
				</div>
				<IconButton label="Close" icon={X} onclick={onclose} />
			</header>
			<div class="body">{@render children()}</div>
			{#if footer}<footer>{@render footer()}</footer>{/if}
		</div>
	{/if}
</dialog>

<style>
	dialog {
		padding: 0;
		border: 0;
		background: var(--color-surface);
		color: var(--color-text);
		max-height: 100dvh;
		overflow: hidden;
	}

	dialog::backdrop {
		background: var(--color-overlay);
	}

	.panel {
		display: flex;
		flex-direction: column;
		max-height: inherit;
	}

	.drawer .panel {
		height: 100%;
	}

	header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: var(--space-2);
		padding: var(--space-3) var(--space-3) var(--space-2);
	}

	.titles {
		min-width: 0;
	}

	.title-row {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: var(--space-1) var(--space-2);
	}

	.eyebrow {
		color: var(--color-text-muted);
		font-size: var(--text-caption);
		line-height: var(--lh-caption);
		letter-spacing: var(--ls-caption);
	}

	.body {
		flex: 1;
		min-height: 0;
		overflow-y: auto;
		padding: 0 var(--space-3) var(--space-3);
	}

	footer {
		display: flex;
		justify-content: flex-end;
		flex-wrap: wrap;
		gap: var(--space-1);
		padding: var(--space-2) var(--space-3);
		border-top: 1px solid var(--color-border);
		background: var(--color-surface);
	}

	/* Modal: centred card with sheet radius */
	.modal {
		width: min(100% - 2 * var(--space-2), 520px);
		/* Centred, so it needs the larger system bar inset at both ends */
		max-height: min(100dvh - 2 * (var(--space-2) + max(var(--safe-top), var(--safe-bottom))), 880px);
		border-radius: var(--radius-sheet);
		animation: rise var(--duration) var(--ease);
	}

	.modal.sm {
		width: min(100% - 2 * var(--space-2), 440px);
	}

	.modal.lg {
		width: min(100% - 2 * var(--space-2), 680px);
	}

	/* Drawer: right-hand sheet, 24 px radius on the open edge */
	.drawer {
		margin: 0 0 0 auto;
		height: 100dvh;
		/* Full height: keep the header below the status bar and the footer above the navigation bar */
		padding: var(--safe-top) var(--safe-right) var(--safe-bottom) 0;
		width: min(100%, 520px);
		border-radius: var(--radius-sheet) 0 0 var(--radius-sheet);
		animation: slide-in calc(var(--duration) * 1.5) var(--ease);
	}

	@media (max-width: 639px) {
		.drawer {
			margin: auto 0 0;
			width: 100%;
			max-width: 100%;
			height: min(92dvh, 100dvh - var(--safe-top) - var(--space-2));
			padding: 0 var(--safe-right) var(--safe-bottom) var(--safe-left);
			border-radius: var(--radius-sheet) var(--radius-sheet) 0 0;
			animation-name: slide-up;
		}

		header,
		.body,
		footer {
			padding-left: var(--space-2);
			padding-right: var(--space-2);
		}

		footer > :global(*) {
			flex: 1;
		}
	}

	@keyframes rise {
		from {
			opacity: 0;
			transform: translateY(16px);
		}
	}

	@keyframes slide-in {
		from {
			transform: translateX(100%);
		}
	}

	@keyframes slide-up {
		from {
			transform: translateY(100%);
		}
	}
</style>
