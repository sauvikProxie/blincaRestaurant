<script lang="ts">
	import Copy from '@lucide/svelte/icons/copy';
	import MenuButton from '$lib/components/ui/MenuButton.svelte';
	import Toggle from '$lib/components/ui/Toggle.svelte';
	import type { DaySchedule } from '$lib/types';
	import { isOvernight } from '$lib/utils/restaurant-status';
	import type { DayErrors } from '$lib/utils/schedule-validation';

	interface Props {
		day: DaySchedule;
		errors: DayErrors | undefined;
		onchange: (day: DaySchedule) => void;
		oncopy: (target: 'all' | 'weekdays' | 'weekend') => void;
	}

	let { day, errors, onchange, oncopy }: Props = $props();

	const name = $derived(day.day.charAt(0).toUpperCase() + day.day.slice(1));
	const overnight = $derived(day.isOpen && isOvernight(day));
	const openId = $derived(`${day.day}-open`);
	const closeId = $derived(`${day.day}-close`);
</script>

<div class="row" class:closed={!day.isOpen}>
	<div class="day">
		<p>{name}</p>
		<p class="state">{day.isOpen ? 'Open' : 'Closed all day'}</p>
	</div>

	<div class="toggle">
		<Toggle
			checked={day.isOpen}
			label="Open on {name}"
			hideLabel
			onchange={(isOpen) => onchange({ ...day, isOpen })}
		/>
	</div>

	<div class="field">
		<label class="field-label" for={openId}>Opens</label>
		<input
			id={openId}
			class="input"
			type="time"
			value={day.openTime}
			disabled={!day.isOpen}
			aria-invalid={!!errors?.openTime}
			aria-describedby={errors?.openTime ? `${openId}-error` : undefined}
			onchange={(e) => onchange({ ...day, openTime: e.currentTarget.value })}
		/>
		{#if errors?.openTime}<p id="{openId}-error" class="field-error">{errors.openTime}</p>{/if}
	</div>

	<div class="field">
		<label class="field-label" for={closeId}>
			Closes {#if overnight}<span class="next-day">(next day)</span>{/if}
		</label>
		<input
			id={closeId}
			class="input"
			type="time"
			value={day.closeTime}
			disabled={!day.isOpen}
			aria-invalid={!!errors?.closeTime}
			aria-describedby={errors?.closeTime ? `${closeId}-error` : undefined}
			onchange={(e) => onchange({ ...day, closeTime: e.currentTarget.value })}
		/>
		{#if errors?.closeTime}<p id="{closeId}-error" class="field-error">{errors.closeTime}</p>{/if}
	</div>

	<div class="copy">
		<MenuButton
			label="Copy to"
			icon={Copy}
			items={[
				{ label: 'All days', onselect: () => oncopy('all') },
				{ label: 'Weekdays (Mon to Fri)', onselect: () => oncopy('weekdays') },
				{ label: 'Weekend (Sat and Sun)', onselect: () => oncopy('weekend') }
			]}
		/>
	</div>
</div>

<style>
	.row {
		display: grid;
		grid-template-columns: minmax(120px, 1.2fr) 72px minmax(140px, 1fr) minmax(140px, 1fr) auto;
		align-items: start;
		gap: var(--space-2) var(--space-3);
		padding: var(--space-2) var(--space-3);
		border-bottom: 1px solid var(--color-border);
	}

	.row:last-child {
		border-bottom: 0;
	}

	.day,
	.toggle,
	.copy {
		/* Line up with the inputs, below their labels */
		padding-top: calc(var(--lh-caption) + var(--space-1));
		min-height: calc(var(--control-height) + var(--lh-caption) + var(--space-1));
		display: flex;
		align-items: center;
	}

	.day {
		flex-direction: column;
		align-items: flex-start;
		justify-content: center;
	}

	.state {
		color: var(--color-text-muted);
		font-size: var(--text-caption);
		line-height: var(--lh-caption);
		letter-spacing: var(--ls-caption);
	}

	.closed .day p:first-child {
		color: var(--color-text-muted);
	}

	.next-day {
		color: var(--color-action);
	}

	@media (max-width: 767px) {
		.row {
			grid-template-columns: 1fr 1fr;
			padding: var(--space-2);
		}

		.day,
		.toggle,
		.copy {
			padding-top: 0;
			min-height: 0;
		}

		.toggle {
			justify-content: flex-end;
		}

		.copy {
			grid-column: 1 / -1;
			justify-content: flex-end;
		}
	}
</style>
