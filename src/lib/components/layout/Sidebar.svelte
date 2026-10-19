<script lang="ts">
	import LogOut from '@lucide/svelte/icons/log-out';
	import PanelLeft from '@lucide/svelte/icons/panel-left';
	import { page } from '$app/state';
	import { liveOrders } from '$lib/stores/live-orders.svelte';
	import { restaurant } from '$lib/stores/restaurant.svelte';
	import { isActive, NAV_ITEMS } from './nav';

	interface Props {
		/** Desktop preference: icon rail instead of full width. */
		collapsed: boolean;
		/** Tablet and phone: the full menu is open over the page. */
		overlayOpen: boolean;
		oncollapse: () => void;
		onnavigate: () => void;
		onsignout: () => void;
	}

	let { collapsed, overlayOpen, oncollapse, onnavigate, onsignout }: Props = $props();

	const activeCount = $derived(liveOrders.orders.length);
	const items = $derived(NAV_ITEMS.filter((item) => !item.managersOnly || restaurant.canSeeReports));
</script>

<nav id="sidebar" class="sidebar" class:collapsed class:overlay-open={overlayOpen} aria-label="Main">
	<ul>
		{#each items as item (item.href)}
			{@const active = isActive(item.href, page.url.pathname)}
			<li>
				<a
					href={item.href}
					aria-current={active ? 'page' : undefined}
					title={item.label}
					onclick={onnavigate}
				>
					<item.icon size={24} strokeWidth={2} aria-hidden="true" />
					<span class="label">{item.label}</span>
					{#if item.href === '/' && activeCount > 0}
						<span class="count" aria-label="{activeCount} active orders">{activeCount}</span>
					{/if}
				</a>
			</li>
		{/each}
	</ul>

	<div class="footer">
		<button type="button" class="footer-button" title="Sign out" onclick={onsignout}>
			<LogOut size={22} strokeWidth={2} aria-hidden="true" />
			<span class="label">Sign out</span>
		</button>

		<button
			type="button"
			class="footer-button collapse"
			aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
			title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
			onclick={oncollapse}
		>
			<PanelLeft size={22} strokeWidth={2} aria-hidden="true" />
			<span class="label">Collapse</span>
		</button>
	</div>
</nav>

<style>
	.sidebar {
		position: sticky;
		top: var(--header-offset);
		z-index: var(--z-sidebar);
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		width: calc(var(--sidebar-width) + var(--safe-left));
		height: calc(100dvh - var(--header-offset));
		/* Clear of a side camera cutout (landscape) and the navigation bar */
		padding: var(--space-2) var(--space-2) calc(var(--space-2) + var(--safe-bottom)) calc(var(--space-2) + var(--safe-left));
		background: var(--color-surface);
		border-right: 1px solid var(--color-border);
		overflow-y: auto;
		transition:
			width var(--duration) var(--ease),
			transform var(--duration) var(--ease);
	}

	ul {
		display: flex;
		flex-direction: column;
		gap: var(--space-half);
		margin: 0;
		padding: 0;
		list-style: none;
	}

	a,
	.footer-button {
		position: relative;
		display: flex;
		align-items: center;
		gap: var(--space-2);
		height: var(--control-height);
		padding: 0 var(--space-2);
		border-radius: var(--radius-pill);
		color: var(--color-text);
		text-decoration: none;
		white-space: nowrap;
		transition: background-color var(--duration) var(--ease);
	}

	a :global(svg),
	.footer-button :global(svg) {
		flex: none;
	}

	a:hover,
	.footer-button:hover {
		background: var(--color-hover);
	}

	/* Selected: Blush panel with Cranberry Deep text and icon */
	a[aria-current='page'] {
		background: var(--color-tint);
		color: var(--color-action);
	}

	.count {
		display: grid;
		place-items: center;
		min-width: 24px;
		height: 24px;
		padding: 0 6px;
		margin-left: auto;
		border-radius: var(--radius-pill);
		background: var(--color-action);
		color: var(--color-text-inverse);
		font-size: var(--text-caption);
	}

	.footer {
		display: flex;
		flex-direction: column;
		gap: var(--space-half);
		padding-top: var(--space-2);
	}

	.footer-button {
		width: 100%;
		border: 0;
		background: none;
		color: var(--color-text-muted);
	}

	/* Rail: icons only */
	.collapsed {
		width: calc(var(--sidebar-rail) + var(--safe-left));
	}

	.collapsed .label {
		display: none;
	}

	.collapsed .collapse :global(svg) {
		transform: scaleX(-1);
	}

	.collapsed .count {
		position: absolute;
		top: 4px;
		right: 4px;
		min-width: 20px;
		height: 20px;
		font-size: 11px;
	}

	/* Tablet: icon rail, full menu slides over the page when opened */
	@media (max-width: 1199px) {
		.sidebar {
			width: calc(var(--sidebar-rail) + var(--safe-left));
		}

		.sidebar:not(.overlay-open) .label {
			display: none;
		}

		.sidebar:not(.overlay-open) .count {
			position: absolute;
			top: 4px;
			right: 4px;
			min-width: 20px;
			height: 20px;
			font-size: 11px;
		}

		.overlay-open {
			position: fixed;
			left: 0;
			width: calc(var(--sidebar-width) + var(--safe-left));
		}

		.collapse {
			display: none;
		}
	}

	/* Phone: hidden until opened */
	@media (max-width: 767px) {
		.sidebar {
			position: fixed;
			left: 0;
			width: calc(var(--sidebar-width) + var(--safe-left));
			transform: translateX(-100%);
		}

		.sidebar .label {
			display: inline;
		}

		.overlay-open {
			transform: none;
		}
	}
</style>
