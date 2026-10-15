<script lang="ts">
	import { beforeNavigate, goto } from '$app/navigation';
	import DayRow from '$lib/components/schedule/DayRow.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import ConfirmDialog from '$lib/components/ui/ConfirmDialog.svelte';
	import ErrorState from '$lib/components/ui/ErrorState.svelte';
	import PageHeader from '$lib/components/ui/PageHeader.svelte';
	import Skeleton from '$lib/components/ui/Skeleton.svelte';
	import { restaurant } from '$lib/stores/restaurant.svelte';
	import { toasts } from '$lib/stores/toasts.svelte';
	import { WEEKDAYS, type DaySchedule, type Schedule, type Weekday } from '$lib/types';
	import { describeStatus } from '$lib/utils/restaurant-status';
	import { copyDayTo, schedulesEqual, validateSchedule } from '$lib/utils/schedule-validation';

	const COPY_TARGETS: Record<'all' | 'weekdays' | 'weekend', readonly Weekday[]> = {
		all: WEEKDAYS,
		weekdays: WEEKDAYS.slice(0, 5),
		weekend: WEEKDAYS.slice(5)
	};

	let draft = $state<Schedule | null>(null);
	let saving = $state(false);
	let leaveTo = $state<URL | null>(null);

	$effect(() => {
		if (restaurant.schedule && !draft) draft = structuredClone($state.snapshot(restaurant.schedule));
	});

	const errors = $derived(draft ? validateSchedule(draft) : {});
	const hasErrors = $derived(Object.keys(errors).length > 0);
	const dirty = $derived(!!draft && !!restaurant.schedule && !schedulesEqual(draft, restaurant.schedule));

	function updateDay(next: DaySchedule) {
		if (draft) draft = draft.map((d) => (d.day === next.day ? next : d));
	}

	function copy(source: Weekday, target: keyof typeof COPY_TARGETS) {
		if (!draft) return;
		draft = copyDayTo(draft, source, COPY_TARGETS[target]);
		toasts.show(`Copied ${source.charAt(0).toUpperCase() + source.slice(1)}'s hours. Save to keep them.`);
	}

	function cancel() {
		if (restaurant.schedule) draft = structuredClone($state.snapshot(restaurant.schedule));
	}

	async function save() {
		if (!draft) return;
		if (hasErrors) {
			toasts.error('Some days need fixing first. Check the highlighted times.');
			return;
		}
		saving = true;
		try {
			await restaurant.saveSchedule($state.snapshot(draft));
			const status = restaurant.status;
			const now = status ? ` ${describeStatus(status, new Date()).headline}.` : '';
			toasts.success(`Hours saved. Your status follows them from now on.${now}`);
		} catch {
			toasts.error("Sorry, we couldn't save your hours. Please try again.");
		} finally {
			saving = false;
		}
	}

	beforeNavigate((navigation) => {
		if (!dirty || !navigation.to || leaveTo) return;
		if (navigation.type === 'leave') {
			// Closing the tab or reloading: the browser shows its own prompt.
			navigation.cancel();
			return;
		}
		navigation.cancel();
		leaveTo = navigation.to.url;
	});

	function discardAndLeave() {
		const target = leaveTo;
		cancel();
		leaveTo = null;
		if (target) goto(target);
	}
</script>

<svelte:head><title>Scheduled Hours - Blinca</title></svelte:head>

<PageHeader
	title="Scheduled Hours"
	description="Set when you take orders each day. Your Open and Closed status follows these hours automatically."
/>

{#if restaurant.error}
	<div class="card"><ErrorState what="your hours" onretry={() => restaurant.load()} /></div>
{:else if !draft}
	<div class="card" aria-busy="true">
		{#each WEEKDAYS as day (day)}
			<div class="skeleton-row">
				<Skeleton width="120px" height="20px" />
				<Skeleton width="48px" height="28px" radius="pill" />
				<Skeleton height="52px" radius="pill" />
				<Skeleton height="52px" radius="pill" />
			</div>
		{/each}
	</div>
{:else}
	<p class="hint muted">
		Open late? Set a closing time earlier than the opening time, like 18:00 to 02:00, and it runs into the next day.
	</p>

	<div class="card">
		{#each draft as day (day.day)}
			<DayRow {day} errors={errors[day.day]} onchange={updateDay} oncopy={(target) => copy(day.day, target)} />
		{/each}
	</div>

	<div class="save-bar" class:dirty>
		<p class="save-state" aria-live="polite">
			{#if dirty}
				<span class="dot" aria-hidden="true"></span>You have unsaved changes
			{:else}
				All changes saved
			{/if}
		</p>
		<div class="save-actions">
			<Button variant="secondary" disabled={!dirty || saving} onclick={cancel}>Cancel</Button>
			<Button disabled={!dirty} loading={saving} onclick={save}>Save hours</Button>
		</div>
	</div>
{/if}

<ConfirmDialog
	open={!!leaveTo}
	title="Leave without saving?"
	body="Your changes to the opening hours haven't been saved yet. If you leave now, they'll be lost."
	confirmLabel="Discard changes"
	cancelLabel="Keep editing"
	onconfirm={discardAndLeave}
	oncancel={() => (leaveTo = null)}
/>

<style>
	.hint {
		margin-bottom: var(--space-2);
		font-size: var(--text-caption);
		letter-spacing: var(--ls-caption);
	}

	.card {
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-card);
	}

	.skeleton-row {
		display: grid;
		grid-template-columns: 1.2fr 72px 1fr 1fr;
		align-items: center;
		gap: var(--space-3);
		padding: var(--space-3);
		border-bottom: 1px solid var(--color-border);
	}

	.save-bar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		flex-wrap: wrap;
		gap: var(--space-2);
		margin-top: var(--space-3);
		padding: var(--space-2) var(--space-2) var(--space-2) var(--space-3);
		border-radius: var(--radius-pill);
		border: 1px solid var(--color-border);
		background: var(--color-surface);
		transition: border-color var(--duration) var(--ease);
	}

	/* Only follows you down the page when there is something to save */
	.save-bar.dirty {
		position: sticky;
		bottom: calc(var(--space-2) + var(--safe-bottom));
		border-color: var(--color-primary);
		background: var(--color-tint);
	}

	.save-state {
		display: inline-flex;
		align-items: center;
		gap: var(--space-1);
	}

	.dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: var(--color-primary);
	}

	.save-actions {
		display: flex;
		gap: var(--space-1);
	}

	@media (max-width: 767px) {
		.skeleton-row {
			grid-template-columns: 1fr 1fr;
		}

		.save-bar {
			border-radius: var(--radius-card);
			padding: var(--space-2);
		}

		.save-actions {
			width: 100%;
		}

		.save-actions > :global(*) {
			flex: 1;
		}
	}
</style>
