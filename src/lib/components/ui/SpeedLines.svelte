<script lang="ts">
	/**
	 * The brand's speed-lines device (08 Interface), taken from the logo mark.
	 * Used to show motion: hero panels, arrivals and loading.
	 */
	interface Props {
		/** Animate the lines, e.g. while something is loading. */
		moving?: boolean;
		size?: 'sm' | 'md' | 'lg';
	}

	let { moving = false, size = 'md' }: Props = $props();

	const rows = [
		{ stub: 14, line: 56 },
		{ stub: 26, line: 88 },
		{ stub: 10, line: 66 }
	];
</script>

<span class="speed {size}" class:moving aria-hidden="true">
	{#each rows as row, i (i)}
		<span class="row" style:--stub={row.stub} style:--line={row.line} style:--i={i}>
			<span class="stub"></span>
			<span class="line"></span>
		</span>
	{/each}
</span>

<style>
	.speed {
		--unit: 1px;
		display: inline-flex;
		flex-direction: column;
		gap: calc(var(--unit) * 5);
		color: currentColor;
	}

	.sm {
		--unit: 0.5px;
	}

	.lg {
		--unit: 1.6px;
	}

	.row {
		display: flex;
		gap: calc(var(--unit) * 5);
	}

	.stub,
	.line {
		height: calc(var(--unit) * 7);
		border-radius: var(--radius-pill);
		background: currentColor;
	}

	.stub {
		width: calc(var(--stub) * var(--unit));
		opacity: 0.45;
	}

	.line {
		width: calc(var(--line) * var(--unit));
	}

	.moving .row {
		animation: dash 1.1s var(--ease) infinite;
		animation-delay: calc(var(--i) * 120ms);
	}

	@keyframes dash {
		0%,
		100% {
			transform: translateX(0);
			opacity: 1;
		}
		50% {
			transform: translateX(calc(var(--unit) * 10));
			opacity: 0.6;
		}
	}
</style>
