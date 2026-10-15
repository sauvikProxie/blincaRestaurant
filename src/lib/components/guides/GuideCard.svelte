<script lang="ts">
	import ArrowRight from '@lucide/svelte/icons/arrow-right';
	import ChevronDown from '@lucide/svelte/icons/chevron-down';
	import Badge from '$lib/components/ui/Badge.svelte';
	import type { Guide } from '$lib/types';
	import { formatDate, fromISODate, pluralize } from '$lib/utils/format';

	interface Props {
		guide: Guide;
		expanded: boolean;
		ontoggle: () => void;
	}

	let { guide, expanded, ontoggle }: Props = $props();
</script>

<article class="guide" class:expanded>
	<h2 class="heading">
		<button
			type="button"
			class="toggle"
			aria-expanded={expanded}
			aria-controls="guide-{guide.id}-steps"
			onclick={ontoggle}
		>
			<span class="text">
				<span class="title-row">
					<span class="title">{guide.title}</span>
					{#if guide.isNew}<Badge tone="tint">New</Badge>{/if}
				</span>
				<span class="description">{guide.description}</span>
				<span class="meta">{pluralize(guide.steps.length, 'step')}, added {formatDate(fromISODate(guide.publishedOn))}</span>
			</span>
			<span class="chevron" aria-hidden="true"><ChevronDown size={24} strokeWidth={2} /></span>
		</button>
	</h2>

	{#if expanded}
		<ol id="guide-{guide.id}-steps" class="steps">
			{#each guide.steps as step, index (index)}
				<li>
					<span class="number" aria-hidden="true">{index + 1}</span>
					<div class="step">
						<p>{step.text}</p>
						{#if step.link}
							<a class="step-link" href={step.link.href}>
								{step.link.label}
								<ArrowRight size={16} strokeWidth={2} aria-hidden="true" />
							</a>
						{/if}
					</div>
				</li>
			{/each}
		</ol>
	{/if}
</article>

<style>
	.guide {
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-card);
		transition: border-color var(--duration) var(--ease);
	}

	.guide.expanded {
		border-color: var(--color-border-strong);
	}

	.heading {
		font-size: inherit;
	}

	.toggle {
		display: flex;
		align-items: flex-start;
		gap: var(--space-2);
		width: 100%;
		padding: var(--space-3);
		border: 0;
		border-radius: var(--radius-card);
		background: none;
		text-align: left;
	}

	.toggle:hover .title {
		color: var(--color-action);
	}

	.text {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: var(--space-half);
		min-width: 0;
	}

	.title-row {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: var(--space-1);
	}

	.title {
		font-size: var(--text-h2);
		line-height: var(--lh-h2);
		letter-spacing: var(--ls-h2);
		transition: color var(--duration) var(--ease);
	}

	.description {
		color: var(--color-text-muted);
	}

	.meta {
		color: var(--color-text-muted);
		font-size: var(--text-caption);
		line-height: var(--lh-caption);
		letter-spacing: var(--ls-caption);
	}

	.chevron {
		display: grid;
		place-items: center;
		flex: none;
		width: 44px;
		height: 44px;
		border-radius: 50%;
		background: var(--color-tint);
		color: var(--color-action);
		transition: transform var(--duration) var(--ease);
	}

	.expanded .chevron {
		transform: rotate(180deg);
	}

	.steps {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
		margin: 0;
		padding: 0 var(--space-3) var(--space-3);
		list-style: none;
	}

	li {
		display: flex;
		gap: var(--space-2);
	}

	.number {
		display: grid;
		place-items: center;
		flex: none;
		width: 32px;
		height: 32px;
		border-radius: 50%;
		background: var(--color-action);
		color: var(--color-text-inverse);
		font-size: var(--text-caption);
	}

	.step {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: var(--space-1);
		padding-top: var(--space-half);
	}

	.step-link {
		display: inline-flex;
		align-items: center;
		gap: var(--space-half);
		text-underline-offset: 4px;
		font-size: var(--text-caption);
		letter-spacing: var(--ls-caption);
	}

	@media (max-width: 767px) {
		.toggle {
			padding: var(--space-2);
		}

		.steps {
			padding: 0 var(--space-2) var(--space-2);
		}
	}
</style>
