<script lang="ts">
	import CalendarClock from '@lucide/svelte/icons/calendar-clock';
	import Play from '@lucide/svelte/icons/play';
	import Button from '$lib/components/ui/Button.svelte';
	import Chip from '$lib/components/ui/Chip.svelte';
	import ErrorState from '$lib/components/ui/ErrorState.svelte';
	import Modal from '$lib/components/ui/Modal.svelte';
	import Skeleton from '$lib/components/ui/Skeleton.svelte';
	import SpeedLines from '$lib/components/ui/SpeedLines.svelte';
	import Toggle from '$lib/components/ui/Toggle.svelte';
	import { errorMessage } from '$lib/convex/errors';
	import { clock } from '$lib/stores/clock.svelte';
	import { liveOrders } from '$lib/stores/live-orders.svelte';
	import { restaurant } from '$lib/stores/restaurant.svelte';
	import { toasts } from '$lib/stores/toasts.svelte';
	import { PAUSE_MINUTES, type PauseMinutes } from '$lib/types';
	import { pluralize } from '$lib/utils/format';
	import { describeStatus } from '$lib/utils/restaurant-status';

	const openState = $derived(restaurant.state);
	const info = $derived(restaurant.info);
	const copy = $derived(info ? describeStatus(info, clock.now.getTime()) : null);
	const isOpen = $derived(openState === 'open');
	/** Closed by the opening hours (or by Blinca): nothing to switch here. */
	const closedByHours = $derived(openState === 'closed');

	let pauseOpen = $state(false);
	let pauseFor = $state<PauseMinutes | null>(PAUSE_MINUTES[0]);

	function requestToggle() {
		if (isOpen) {
			pauseFor = PAUSE_MINUTES[0];
			pauseOpen = true;
		} else if (openState === 'paused') {
			resume();
		}
	}

	async function pause() {
		try {
			await restaurant.pause(pauseFor);
			pauseOpen = false;
			toasts.success(pauseFor ? `New orders paused for ${pauseFor} min.` : 'New orders paused until you switch back on.');
		} catch (error) {
			toasts.error(errorMessage(error));
		}
	}

	async function resume() {
		try {
			await restaurant.resume();
			toasts.success(restaurant.state === 'open' ? "You're taking orders again." : 'Pause ended.');
		} catch (error) {
			toasts.error(errorMessage(error));
		}
	}
</script>

{#if restaurant.error && !info}
	<section class="card closed"><ErrorState what="your opening status" onretry={() => restaurant.retry()} /></section>
{:else if !info || !copy || !openState}
	<section class="card closed" aria-busy="true">
		<div class="main">
			<div class="text">
				<Skeleton width="220px" height="46px" />
				<Skeleton width="180px" height="18px" />
			</div>
			<Skeleton width="64px" height="36px" radius="pill" />
		</div>
	</section>
{:else}
	<section class="card" class:open={isOpen} class:closed={!isOpen} aria-labelledby="status-headline">
		<div class="main">
			<span class="lines"><SpeedLines size="lg" moving={isOpen} /></span>
			<div class="text">
				<h2 id="status-headline" class="text-h1">{copy.headline}</h2>
				<p class="detail" aria-live="polite">{copy.detail}</p>
			</div>
			{#if !closedByHours}
				<div class="switch">
					<Toggle
						size="lg"
						checked={isOpen}
						label={isOpen ? 'Taking orders. Switch off to pause new orders' : 'Paused. Switch on to take orders again'}
						hideLabel
						inverse={isOpen}
						disabled={restaurant.busy}
						onchange={requestToggle}
					/>
					<span class="switch-label">{isOpen ? 'Taking orders' : 'Paused'}</span>
				</div>
			{/if}
		</div>

		<div class="footer">
			{#if openState === 'paused'}
				<p class="note">New orders are paused. Orders already in the kitchen still need finishing.</p>
				<Button size="sm" variant="secondary" icon={Play} onclick={resume} loading={restaurant.busy}>Resume now</Button>
			{:else}
				<p class="note">
					<CalendarClock size={18} strokeWidth={2} aria-hidden="true" />
					Opening hours are managed in the Blinca web portal.
				</p>
			{/if}
		</div>
	</section>
{/if}

<Modal open={pauseOpen} title="Pause new orders?" size="sm" onclose={() => (pauseOpen = false)}>
	<p class="muted">
		{#if liveOrders.orders.length}
			You still have {pluralize(liveOrders.orders.length, 'order')} in the kitchen to finish.
		{/if}
		Customers can't order from you while paused.
	</p>
	<div class="choices" role="group" aria-label="Pause for">
		{#each PAUSE_MINUTES as minutes (minutes)}
			<Chip selected={pauseFor === minutes} onclick={() => (pauseFor = minutes)}>{minutes} min</Chip>
		{/each}
		<Chip selected={pauseFor === null} onclick={() => (pauseFor = null)}>Until I switch back on</Chip>
	</div>
	{#snippet footer()}
		<Button variant="secondary" onclick={() => (pauseOpen = false)} disabled={restaurant.busy}>Stay open</Button>
		<Button onclick={pause} loading={restaurant.busy}>Pause orders</Button>
	{/snippet}
</Modal>

<style>
	.card {
		position: relative;
		overflow: hidden;
		border-radius: var(--radius-sheet);
		border: 1px solid var(--color-border);
		transition: background-color var(--duration) var(--ease);
	}

	/* Open: Cranberry Deep surface so all white text passes contrast (6.6:1) */
	.open {
		background: var(--color-action);
		border-color: var(--color-action);
		color: var(--color-text-inverse);
	}

	.closed {
		background: var(--color-surface);
		color: var(--color-text);
	}

	.main {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		padding: var(--space-4);
	}

	.lines {
		flex: none;
		color: var(--color-primary);
	}

	.closed .lines {
		color: var(--color-border-strong);
	}

	.text {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
		flex: 1;
		min-width: 0;
	}

	.closed .detail {
		color: var(--color-text-muted);
	}

	.switch {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-1);
	}

	.switch-label {
		font-size: var(--text-caption);
		letter-spacing: var(--ls-caption);
	}

	.footer {
		display: flex;
		align-items: center;
		justify-content: space-between;
		flex-wrap: wrap;
		gap: var(--space-1) var(--space-2);
		padding: var(--space-2) var(--space-4);
		border-top: 1px solid var(--color-border);
	}

	.open .footer {
		border-top-color: color-mix(in srgb, var(--color-white) 25%, transparent);
		background: color-mix(in srgb, var(--color-dark) 12%, transparent);
	}

	.closed .footer {
		background: var(--color-bg);
	}

	.note {
		display: flex;
		align-items: center;
		gap: var(--space-1);
		font-size: var(--text-caption);
		line-height: var(--lh-caption);
		letter-spacing: var(--ls-caption);
	}

	.choices {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-1);
		margin-top: var(--space-3);
	}

	@media (max-width: 767px) {
		.main {
			padding: var(--space-3);
			gap: var(--space-2);
		}

		.footer {
			padding: var(--space-2) var(--space-3);
		}

		.lines {
			display: none;
		}
	}
</style>
