<script lang="ts">
	import CalendarClock from '@lucide/svelte/icons/calendar-clock';
	import Undo2 from '@lucide/svelte/icons/undo-2';
	import Button from '$lib/components/ui/Button.svelte';
	import ConfirmDialog from '$lib/components/ui/ConfirmDialog.svelte';
	import ErrorState from '$lib/components/ui/ErrorState.svelte';
	import Skeleton from '$lib/components/ui/Skeleton.svelte';
	import SpeedLines from '$lib/components/ui/SpeedLines.svelte';
	import Toggle from '$lib/components/ui/Toggle.svelte';
	import { clock } from '$lib/stores/clock.svelte';
	import { liveOrders } from '$lib/stores/live-orders.svelte';
	import { restaurant } from '$lib/stores/restaurant.svelte';
	import { toasts } from '$lib/stores/toasts.svelte';
	import { WEEKDAYS } from '$lib/types';
	import { formatTime, pluralize, relativeDay } from '$lib/utils/format';
	import {
		describeStatus,
		getScheduledState,
		isOvernight,
		weekdayIndex
	} from '$lib/utils/restaurant-status';

	const status = $derived(restaurant.status);
	const copy = $derived(status ? describeStatus(status, clock.now) : null);

	const todaysHours = $derived.by(() => {
		const today = restaurant.schedule?.find((d) => d.day === WEEKDAYS[weekdayIndex(clock.now)]);
		if (!today?.isOpen) return 'Closed today on your schedule';
		return `Today: ${today.openTime} - ${today.closeTime}${isOvernight(today) ? ' (next day)' : ''}`;
	});

	let confirmClose = $state(false);

	/** When a manual change made now would hand back to the schedule. */
	function returnTime(): string {
		const next = restaurant.schedule ? getScheduledState(restaurant.schedule, new Date()).nextChange : null;
		if (!next) return 'until you return to schedule';
		const day = relativeDay(next, new Date());
		return `until ${formatTime(next)}${day === 'today' ? '' : ` ${day}`}`;
	}

	function requestToggle() {
		if (!status) return;
		// Switching off always closes, whether it starts an override or hands back to a closed schedule.
		if (status.isOpen && liveOrders.orders.length > 0) confirmClose = true;
		else applyToggle();
	}

	async function applyToggle() {
		const until = returnTime();
		try {
			await restaurant.toggle();
			confirmClose = false;
			const now = restaurant.status;
			if (!now) return;
			if (now.source === 'schedule') toasts.success("Back on schedule. We'll follow your hours again.");
			else toasts.success(now.isOpen ? `You're open ${until}.` : `You're closed ${until}. New orders are paused.`);
		} catch {
			toasts.error("Sorry, we couldn't change your status. Please try again.");
		}
	}

	async function returnToSchedule() {
		try {
			await restaurant.returnToSchedule();
			toasts.success("Back on schedule. We'll follow your hours again.");
		} catch {
			toasts.error("Sorry, we couldn't change your status. Please try again.");
		}
	}
</script>

{#if restaurant.error}
	<section class="card closed"><ErrorState what="your opening status" onretry={() => restaurant.load()} /></section>
{:else if !status || !copy}
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
	<section class="card" class:open={status.isOpen} class:closed={!status.isOpen} aria-labelledby="status-headline">
		<div class="main">
			<span class="lines"><SpeedLines size="lg" moving={status.isOpen} /></span>
			<div class="text">
				<h2 id="status-headline" class="text-h1">{copy.headline}</h2>
				<p class="detail" aria-live="polite">{copy.detail}</p>
			</div>
			<div class="switch">
				<Toggle
					size="lg"
					checked={status.isOpen}
					label={status.isOpen ? 'Open. Switch off to close now' : 'Closed. Switch on to open now'}
					hideLabel
					inverse={status.isOpen}
					disabled={restaurant.busy}
					onchange={requestToggle}
				/>
				<span class="switch-label">{status.isOpen ? 'Open' : 'Closed'}</span>
			</div>
		</div>

		<div class="footer">
			{#if status.source === 'override'}
				<p class="override-note">You changed this manually. We'll switch back to your schedule automatically.</p>
				<Button
					size="sm"
					variant={status.isOpen ? 'inverse' : 'secondary'}
					icon={Undo2}
					onclick={returnToSchedule}
					loading={restaurant.busy}
				>
					Return to schedule
				</Button>
			{:else}
				<p class="override-note">
					<CalendarClock size={18} strokeWidth={2} aria-hidden="true" />
					{todaysHours}. Following your schedule automatically.
				</p>
				<Button size="sm" variant="link" href="/schedule">Edit hours</Button>
			{/if}
		</div>
	</section>
{/if}

<ConfirmDialog
	open={confirmClose}
	title="Close with {pluralize(liveOrders.orders.length, 'active order')}?"
	body="You'll still need to finish {liveOrders.orders.length === 1
		? 'it'
		: 'them'}. We'll pause new orders {returnTime()}."
	confirmLabel="Close for now"
	cancelLabel="Stay open"
	busy={restaurant.busy}
	onconfirm={applyToggle}
	oncancel={() => (confirmClose = false)}
/>

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

	.override-note {
		display: flex;
		align-items: center;
		gap: var(--space-1);
		font-size: var(--text-caption);
		line-height: var(--lh-caption);
		letter-spacing: var(--ls-caption);
	}

	.open .footer :global(.link) {
		color: var(--color-text-inverse);
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
