<script lang="ts">
	interface Props {
		width?: string;
		height?: string;
		radius?: 'sm' | 'card' | 'pill' | 'circle';
	}

	let { width = '100%', height = '16px', radius = 'sm' }: Props = $props();
</script>

<span class="skeleton {radius}" style:width style:height aria-hidden="true"></span>

<style>
	.skeleton {
		display: block;
		flex: none;
		max-width: 100%;
		background: linear-gradient(
				90deg,
				transparent 0%,
				color-mix(in srgb, var(--color-white) 70%, transparent) 50%,
				transparent 100%
			)
			0 0 / 200% 100% no-repeat,
			var(--color-stone-tint);
		animation: shimmer 1.4s linear infinite;
	}

	.sm {
		border-radius: var(--radius-sm);
	}

	.card {
		border-radius: var(--radius-card);
	}

	.pill {
		border-radius: var(--radius-pill);
	}

	.circle {
		border-radius: 50%;
	}

	@keyframes shimmer {
		from {
			background-position: 150% 0, 0 0;
		}
		to {
			background-position: -150% 0, 0 0;
		}
	}
</style>
