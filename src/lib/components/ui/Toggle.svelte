<script lang="ts">
	interface Props {
		checked: boolean;
		/** Accessible name. Shown next to the switch unless hideLabel is set. */
		label: string;
		hideLabel?: boolean;
		disabled?: boolean;
		/** On a Cranberry surface: the track uses white when on. */
		inverse?: boolean;
		size?: 'md' | 'lg';
		onchange: (checked: boolean) => void;
	}

	let { checked, label, hideLabel = false, disabled = false, inverse = false, size = 'md', onchange }: Props =
		$props();
</script>

<button
	type="button"
	role="switch"
	aria-checked={checked}
	aria-label={hideLabel ? label : undefined}
	class="toggle {size}"
	class:inverse
	{disabled}
	onclick={() => onchange(!checked)}
>
	<span class="track" aria-hidden="true"><span class="thumb"></span></span>
	{#if !hideLabel}<span class="label">{label}</span>{/if}
</button>

<style>
	.toggle {
		display: inline-flex;
		align-items: center;
		gap: var(--space-1);
		padding: var(--space-half);
		margin: calc(var(--space-half) * -1);
		border: 0;
		background: none;
		border-radius: var(--radius-pill);
		color: inherit;
	}

	.toggle:disabled {
		cursor: not-allowed;
		opacity: 0.5;
	}

	.track {
		--w: 48px;
		--h: 28px;
		position: relative;
		flex: none;
		width: var(--w);
		height: var(--h);
		border-radius: var(--radius-pill);
		background: var(--color-border-strong);
		transition: background-color var(--duration) var(--ease);
	}

	.lg .track {
		--w: 64px;
		--h: 36px;
	}

	.thumb {
		position: absolute;
		top: 3px;
		left: 3px;
		width: calc(var(--h) - 6px);
		height: calc(var(--h) - 6px);
		border-radius: 50%;
		background: var(--color-surface);
		transition: transform var(--duration) var(--ease);
	}

	[aria-checked='true'] .track {
		background: var(--color-action);
	}

	[aria-checked='true'] .thumb {
		transform: translateX(calc(var(--w) - var(--h)));
	}

	.inverse .track {
		background: color-mix(in srgb, var(--color-white) 35%, transparent);
	}

	.inverse[aria-checked='true'] .track {
		background: var(--color-surface);
	}

	.inverse[aria-checked='true'] .thumb {
		background: var(--color-primary);
	}

	.label {
		font-size: var(--text-caption);
		line-height: var(--lh-caption);
		letter-spacing: var(--ls-caption);
	}
</style>
