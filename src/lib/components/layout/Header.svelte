<script lang="ts">
	import Menu from '@lucide/svelte/icons/menu';
	import lockup from '$brand/01-Logo/SVG/blinca-lockup-cranberry.svg';
	import mark from '$brand/01-Logo/SVG/blinca-mark-cranberry.svg';
	import Badge from '$lib/components/ui/Badge.svelte';
	import IconButton from '$lib/components/ui/IconButton.svelte';
	import Skeleton from '$lib/components/ui/Skeleton.svelte';
	import { appConfig } from '$lib/config/app.config';
	import { restaurant } from '$lib/stores/restaurant.svelte';

	interface Props {
		menuOpen: boolean;
		onmenu: () => void;
	}

	let { menuOpen, onmenu }: Props = $props();

	const status = $derived(restaurant.status);
</script>

<header class="header">
	<span class="menu-button">
		<IconButton label="Open navigation" icon={Menu} aria-expanded={menuOpen} aria-controls="sidebar" onclick={onmenu} />
	</span>

	<a href="/" class="brand" aria-label="Blinca home">
		<!-- Master artwork only: never redrawn or recoloured (01 Logo) -->
		<img class="lockup" src={lockup} alt="Blinca" width="132" height="41" />
		<img class="mark" src={mark} alt="Blinca" width="36" height="32" />
	</a>

	<span class="divider" aria-hidden="true"></span>
	<p class="restaurant" title={appConfig.restaurant.name}>{appConfig.restaurant.name}</p>

	<a href="/" class="status" aria-live="polite">
		{#if status}
			<Badge tone={status.isOpen ? 'tint' : 'muted'} dot size="md">{status.isOpen ? 'Open' : 'Closed'}</Badge>
			{#if status.source === 'override'}<span class="manual">Manual</span>{/if}
		{:else if restaurant.loading}
			<Skeleton width="88px" height="36px" radius="pill" />
		{/if}
	</a>
</header>

<style>
	.header {
		position: sticky;
		top: 0;
		z-index: var(--z-header);
		display: flex;
		align-items: center;
		gap: var(--space-2);
		/* Extends up behind the status bar; the content sits below it */
		height: var(--header-offset);
		padding: var(--safe-top) calc(var(--page-gutter) + var(--safe-right)) 0 calc(var(--page-gutter) + var(--safe-left));
		background: var(--color-surface);
		border-bottom: 1px solid var(--color-border);
	}

	.menu-button {
		display: none;
		margin-left: calc(var(--space-1) * -1);
	}

	/* Clear space around the logo: nothing crowds it */
	.brand {
		display: flex;
		align-items: center;
		flex: none;
		padding: var(--space-1) 0;
	}

	.lockup {
		width: 132px;
		height: auto;
	}

	.mark {
		display: none;
		width: 36px;
		height: auto;
	}

	.divider {
		width: 1px;
		height: 32px;
		background: var(--color-border-strong);
	}

	.restaurant {
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.status {
		display: flex;
		align-items: center;
		gap: var(--space-1);
		margin-left: auto;
		text-decoration: none;
		color: inherit;
	}

	.manual {
		color: var(--color-text-muted);
		font-size: var(--text-caption);
		letter-spacing: var(--ls-caption);
	}

	@media (max-width: 1199px) {
		.menu-button {
			display: block;
		}
	}

	@media (max-width: 599px) {
		.header {
			gap: var(--space-1);
		}

		.lockup,
		.manual {
			display: none;
		}

		.mark {
			display: block;
		}

		.divider {
			height: 24px;
		}

		.restaurant {
			font-size: var(--text-caption);
		}
	}
</style>
