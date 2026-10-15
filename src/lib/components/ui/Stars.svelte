<script lang="ts">
	import Star from '@lucide/svelte/icons/star';

	interface Props {
		/** 0-5, fractions allowed. */
		value: number;
		size?: number;
	}

	let { value, size = 20 }: Props = $props();
</script>

<span class="stars" role="img" aria-label="{value.toFixed(1)} out of 5 stars">
	{#each { length: 5 } as _, i (i)}
		{@const fill = Math.max(0, Math.min(1, value - i))}
		<span class="star" style:--fill="{fill * 100}%" style:width="{size}px" style:height="{size}px">
			<Star {size} strokeWidth={2} class="base" aria-hidden="true" />
			<span class="filled"><Star {size} strokeWidth={2} fill="currentColor" aria-hidden="true" /></span>
		</span>
	{/each}
</span>

<style>
	/* Saffron is reserved for offers and ratings */
	.stars {
		display: inline-flex;
		gap: 2px;
		color: var(--color-accent);
	}

	.star {
		position: relative;
		display: inline-block;
	}

	.star :global(.base) {
		color: var(--color-border-strong);
	}

	.filled {
		position: absolute;
		inset: 0;
		width: var(--fill);
		overflow: hidden;
	}
</style>
