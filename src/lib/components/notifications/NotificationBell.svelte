<script lang="ts">
	import Bell from '@lucide/svelte/icons/bell';
	import BellRing from '@lucide/svelte/icons/bell-ring';
	import Settings from '@lucide/svelte/icons/settings';
	import VolumeX from '@lucide/svelte/icons/volume-x';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { errorMessage } from '$lib/convex/errors';
	import { clock } from '$lib/stores/clock.svelte';
	import { notifications } from '$lib/stores/notifications.svelte';
	import { toasts } from '$lib/stores/toasts.svelte';
	import { MAX_UNREAD_COUNT, type AppNotification } from '$lib/types';
	import { formatTimeAgo } from '$lib/utils/format';
	import { linkedOrderId, notificationText, unreadBadge } from '$lib/utils/notifications';

	let open = $state(false);
	let root = $state<HTMLDivElement>();
	let trigger = $state<HTMLButtonElement>();
	const panelId = `notifications-${Math.random().toString(36).slice(2, 8)}`;

	const unread = $derived(notifications.unreadCount);
	const badge = $derived(unreadBadge(unread, MAX_UNREAD_COUNT));
	const items = $derived(notifications.feed?.items ?? []);

	function close(focusTrigger = false) {
		open = false;
		if (focusTrigger) trigger?.focus();
	}

	function onWindowClick(event: MouseEvent) {
		if (open && root && !root.contains(event.target as Node)) close();
	}

	function onkeydown(event: KeyboardEvent) {
		if (event.key === 'Escape' && open) close(true);
	}

	function openItem(item: AppNotification) {
		close();
		const orderId = linkedOrderId(item);
		if (orderId) {
			// The order drawer opens from ?order= on any page.
			const url = new URL(page.url);
			url.searchParams.set('order', orderId);
			goto(`${url.pathname}${url.search}`, { noScroll: true });
		}
		if (!item.read) notifications.markRead(item.id).catch(() => {});
	}

	async function markAll() {
		try {
			await notifications.markAllRead();
		} catch (error) {
			toasts.error(errorMessage(error));
		}
	}

	function openSettings() {
		close();
		notifications.settingsOpen = true;
	}
</script>

<svelte:window onclick={onWindowClick} {onkeydown} />

{#if notifications.soundBlocked}
	<!-- Any tap unlocks sound; this button just makes the reason visible. -->
	<button
		type="button"
		class="sound-off"
		aria-label="Sound is off. Tap to turn on sound"
		title="Tap to turn on sound"
		onclick={() => notifications.unlock()}
	>
		<VolumeX size={18} strokeWidth={2} aria-hidden="true" />
		<span class="sound-label">Tap to turn on sound</span>
	</button>
{/if}

<div class="bell" bind:this={root}>
	<button
		bind:this={trigger}
		type="button"
		class="trigger"
		aria-haspopup="dialog"
		aria-expanded={open}
		aria-controls={panelId}
		aria-label={unread ? `Notifications, ${badge} unread` : 'Notifications'}
		title="Notifications"
		onclick={() => (open = !open)}
	>
		{#if unread}<BellRing size={22} strokeWidth={2} aria-hidden="true" />{:else}<Bell
				size={22}
				strokeWidth={2}
				aria-hidden="true"
			/>{/if}
		{#if unread}<span class="count" aria-hidden="true">{badge}</span>{/if}
	</button>

	{#if open}
		<div class="panel" id={panelId} role="dialog" aria-label="Notifications">
			<header>
				<h2 class="title">Notifications</h2>
				<button type="button" class="link" disabled={!unread} onclick={markAll}>Mark all as read</button>
			</header>

			{#if notifications.error && !notifications.feed}
				<p class="empty">{errorMessage(notifications.error)}</p>
			{:else if items.length === 0}
				<p class="empty">{notifications.feed ? 'No notifications yet' : 'Loading…'}</p>
			{:else}
				<ul>
					{#each items as item (item.id)}
						<li>
							<button type="button" class="item" class:unread={!item.read} onclick={() => openItem(item)}>
								<span class="dot" aria-hidden="true"></span>
								<span class="text">
									{notificationText(item)}
									<span class="when">{formatTimeAgo(item.createdAt, clock.now)}</span>
								</span>
								{#if !item.read}<span class="visually-hidden">(unread)</span>{/if}
							</button>
						</li>
					{/each}
				</ul>
			{/if}

			<footer>
				<button type="button" class="link settings" onclick={openSettings}>
					<Settings size={16} strokeWidth={2} aria-hidden="true" />
					Alerts and printing
				</button>
			</footer>
		</div>
	{/if}
</div>

<style>
	.bell {
		position: relative;
		flex: none;
	}

	.trigger {
		position: relative;
		display: grid;
		place-items: center;
		width: 44px;
		height: 44px;
		border: 0;
		border-radius: 50%;
		background: none;
		color: var(--color-text);
	}

	.trigger:hover,
	.trigger[aria-expanded='true'] {
		background: var(--color-tint);
	}

	.count {
		position: absolute;
		top: 2px;
		right: 0;
		min-width: 20px;
		height: 20px;
		padding: 0 5px;
		border-radius: var(--radius-pill);
		background: var(--color-action);
		color: var(--color-text-inverse);
		font-size: 11px;
		line-height: 20px;
		text-align: center;
	}

	.sound-off {
		display: inline-flex;
		align-items: center;
		gap: var(--space-half);
		height: var(--control-height-sm);
		padding: 0 var(--space-2);
		border: 1px solid var(--color-action);
		border-radius: var(--radius-pill);
		background: var(--color-surface);
		color: var(--color-action);
		font-size: var(--text-caption);
		letter-spacing: var(--ls-caption);
		white-space: nowrap;
	}

	.panel {
		position: absolute;
		right: 0;
		top: calc(100% + var(--space-half));
		z-index: 10;
		display: flex;
		flex-direction: column;
		width: 360px;
		max-height: min(70dvh, 520px);
		border-radius: var(--radius-card);
		border: 1px solid var(--color-border);
		background: var(--color-surface);
		box-shadow: 0 8px 24px color-mix(in srgb, var(--color-dark) 12%, transparent);
	}

	header,
	footer {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-2);
		padding: var(--space-2);
	}

	header {
		border-bottom: 1px solid var(--color-border);
	}

	footer {
		border-top: 1px solid var(--color-border);
	}

	.title {
		font-size: var(--text-body);
	}

	.link {
		display: inline-flex;
		align-items: center;
		gap: var(--space-half);
		border: 0;
		background: none;
		padding: 0;
		color: var(--color-action);
		font-size: var(--text-caption);
		letter-spacing: var(--ls-caption);
		text-decoration: underline;
		text-underline-offset: 4px;
	}

	.link:disabled {
		color: var(--color-text-muted);
		text-decoration: none;
		cursor: default;
	}

	ul {
		flex: 1;
		min-height: 0;
		margin: 0;
		padding: var(--space-half) 0;
		list-style: none;
		overflow-y: auto;
	}

	.item {
		display: flex;
		align-items: flex-start;
		gap: var(--space-1);
		width: 100%;
		padding: var(--space-1) var(--space-2);
		border: 0;
		background: none;
		text-align: left;
	}

	.item:hover,
	.item:focus-visible {
		background: var(--color-hover);
	}

	.dot {
		flex: none;
		width: 8px;
		height: 8px;
		margin-top: 8px;
		border-radius: 50%;
	}

	.unread .dot {
		background: var(--color-action);
	}

	.text {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.when,
	.empty {
		color: var(--color-text-muted);
		font-size: var(--text-caption);
		letter-spacing: var(--ls-caption);
	}

	.empty {
		padding: var(--space-4) var(--space-2);
		text-align: center;
	}

	@media (max-width: 599px) {
		.sound-label {
			display: none;
		}

		.sound-off {
			width: 36px;
			padding: 0;
			justify-content: center;
		}

		/* Full width under the header on phones */
		.panel {
			position: fixed;
			left: var(--space-1);
			right: var(--space-1);
			top: calc(var(--header-offset) + var(--space-half));
			width: auto;
		}
	}
</style>
