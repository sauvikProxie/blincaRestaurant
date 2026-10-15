<script lang="ts">
	import type { Snippet } from 'svelte';
	import { afterNavigate, goto } from '$app/navigation';
	import ConfirmDialog from '$lib/components/ui/ConfirmDialog.svelte';
	import { storage } from '$lib/services/storage';
	import { auth } from '$lib/stores/auth.svelte';
	import { liveOrders } from '$lib/stores/live-orders.svelte';
	import { pluralize } from '$lib/utils/format';
	import Header from './Header.svelte';
	import Sidebar from './Sidebar.svelte';

	let { children }: { children: Snippet } = $props();

	let collapsed = $state(storage.get('ui:sidebarCollapsed', false));
	let overlayOpen = $state(false);
	let confirmSignOut = $state(false);

	afterNavigate(() => (overlayOpen = false));

	function toggleCollapsed() {
		collapsed = !collapsed;
		storage.set('ui:sidebarCollapsed', collapsed);
	}

	/** With orders still in progress, check first: signing out stops the live order feed on this device. */
	function requestSignOut() {
		overlayOpen = false;
		if (liveOrders.orders.length > 0) confirmSignOut = true;
		else signOut();
	}

	function signOut() {
		confirmSignOut = false;
		auth.signOut();
		goto('/login', { replaceState: true });
	}

	function onkeydown(event: KeyboardEvent) {
		if (event.key === 'Escape' && overlayOpen) overlayOpen = false;
	}
</script>

<svelte:window {onkeydown} />

<a href="#main" class="skip-link">Skip to content</a>

<div class="shell">
	<Header menuOpen={overlayOpen} onmenu={() => (overlayOpen = !overlayOpen)} />
	<div class="body">
		<Sidebar
			{collapsed}
			{overlayOpen}
			oncollapse={toggleCollapsed}
			onnavigate={() => (overlayOpen = false)}
			onsignout={requestSignOut}
		/>
		{#if overlayOpen}
			<button type="button" class="scrim" aria-label="Close navigation" onclick={() => (overlayOpen = false)}
			></button>
		{/if}
		<main id="main" tabindex="-1">
			{@render children()}
		</main>
	</div>
</div>

<ConfirmDialog
	open={confirmSignOut}
	title="Sign out with {pluralize(liveOrders.orders.length, 'active order')}?"
	body="New orders and updates won't show on this device until someone signs in again."
	confirmLabel="Sign out"
	cancelLabel="Stay signed in"
	onconfirm={signOut}
	oncancel={() => (confirmSignOut = false)}
/>

<style>
	.shell {
		min-height: 100dvh;
	}

	.body {
		display: flex;
		align-items: flex-start;
	}

	main {
		flex: 1;
		min-width: 0;
		max-width: calc(var(--content-max) + 2 * var(--page-gutter));
		/* The last content stays clear of the navigation bar; the right edge of a landscape cutout */
		padding: var(--space-5) calc(var(--page-gutter) + var(--safe-right)) calc(var(--space-8) + var(--safe-bottom))
			var(--page-gutter);
		outline: none;
	}

	.scrim {
		position: fixed;
		inset: var(--header-offset) 0 0 0;
		z-index: calc(var(--z-sidebar) - 1);
		border: 0;
		background: var(--color-overlay);
		cursor: default;
	}

	.skip-link {
		position: absolute;
		left: var(--space-2);
		top: -100px;
		z-index: 100;
		padding: var(--space-1) var(--space-2);
		border-radius: var(--radius-pill);
		background: var(--color-action);
		color: var(--color-text-inverse);
	}

	.skip-link:focus {
		top: calc(var(--space-1) + var(--safe-top));
	}

	@media (max-width: 767px) {
		/* No sidebar on phones, so the content meets the left edge itself */
		main {
			padding-top: var(--space-3);
			padding-left: calc(var(--page-gutter) + var(--safe-left));
		}
	}
</style>
