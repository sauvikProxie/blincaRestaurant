<script lang="ts">
	import Calendar from '@lucide/svelte/icons/calendar';
	import Landmark from '@lucide/svelte/icons/landmark';
	import Pencil from '@lucide/svelte/icons/pencil';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import Badge from '$lib/components/ui/Badge.svelte';
	import IconButton from '$lib/components/ui/IconButton.svelte';
	import SpeedLines from '$lib/components/ui/SpeedLines.svelte';
	import Toggle from '$lib/components/ui/Toggle.svelte';
	import type { Discount, DiscountPhase } from '$lib/types';
	import { DISCOUNT_TYPE_LABELS, discountConditions, discountHeadline } from '$lib/utils/discounts';
	import { formatDate, formatShortDate, fromISODate } from '$lib/utils/format';

	interface Props {
		discount: Discount;
		phase: DiscountPhase;
		busy?: boolean;
		ontoggle: (isActive: boolean) => void;
		onedit: () => void;
		ondelete: () => void;
	}

	let { discount, phase, busy = false, ontoggle, onedit, ondelete }: Props = $props();

	const headline = $derived(discountHeadline(discount));
	const conditions = $derived(discountConditions(discount));
	const validity = $derived(
		`${formatShortDate(fromISODate(discount.validFrom))} - ${formatDate(fromISODate(discount.validTo))}`
	);
	const paused = $derived(phase !== 'expired' && !discount.isActive);
</script>

<article class="ticket {discount.type}" class:expired={phase === 'expired'} class:paused aria-label={discount.title}>
	<div class="stub">
		<span class="lines"><SpeedLines size="sm" /></span>
		<p class="headline">{headline}</p>
		{#if discount.type === 'bank_offer' && discount.bankName}
			<span class="bank-tag"><Landmark size={14} strokeWidth={2} aria-hidden="true" />{discount.bankName}</span>
		{/if}
	</div>

	<div class="body">
		<div class="top">
			<span class="type">{DISCOUNT_TYPE_LABELS[discount.type]}</span>
			{#if phase === 'expired'}
				<Badge tone="muted-outline">Expired</Badge>
			{:else if paused}
				<Badge tone="muted">Paused</Badge>
			{:else if phase === 'scheduled'}
				<Badge tone="dark-outline">Starts {formatShortDate(fromISODate(discount.validFrom))}</Badge>
			{:else}
				<Badge tone="tint" dot>Live</Badge>
			{/if}
		</div>

		<h3 class="title">{discount.title}</h3>

		<ul class="conditions">
			{#each conditions as line (line)}<li>{line}</li>{/each}
		</ul>

		<p class="validity"><Calendar size={16} strokeWidth={2} aria-hidden="true" />{validity}</p>

		<div class="actions">
			<Toggle
				checked={discount.isActive}
				label={discount.isActive ? 'Active' : 'Inactive'}
				disabled={busy || phase === 'expired'}
				onchange={ontoggle}
			/>
			<span class="spacer"></span>
			<IconButton label="Edit {discount.title}" icon={Pencil} onclick={onedit} />
			<IconButton label="Delete {discount.title}" icon={Trash2} onclick={ondelete} />
		</div>
	</div>
</article>

<style>
	.ticket {
		--stub-width: 40%;
		--notch: 12px;
		position: relative;
		display: grid;
		grid-template-columns: var(--stub-width) 1fr;
		min-height: 220px;
		border-radius: var(--radius-card);
		border: 1px solid var(--color-border);
		background: var(--color-surface);
		overflow: hidden;
	}

	/* Ticket notches at the perforation */
	.ticket::before,
	.ticket::after {
		content: '';
		position: absolute;
		z-index: 1;
		left: calc(var(--stub-width) - var(--notch));
		width: calc(var(--notch) * 2);
		height: calc(var(--notch) * 2);
		border-radius: 50%;
		background: var(--color-bg);
		border: 1px solid var(--color-border);
	}

	.ticket::before {
		top: calc(var(--notch) * -1);
	}

	.ticket::after {
		bottom: calc(var(--notch) * -1);
	}

	.stub {
		position: relative;
		display: flex;
		flex-direction: column;
		justify-content: center;
		gap: var(--space-1);
		padding: var(--space-3);
		border-right: 2px dashed color-mix(in srgb, var(--color-white) 55%, transparent);
	}

	.lines {
		opacity: 0.5;
	}

	/* Headline is 28 px+, so white on Cranberry passes the brand's contrast rule */
	.headline {
		font-size: var(--text-h2);
		line-height: var(--lh-h2);
		letter-spacing: var(--ls-h2);
	}

	/* One palette colour per offer type */
	.percentage .stub {
		background: var(--color-primary);
		color: var(--color-text-inverse);
	}

	.flat .stub {
		background: var(--color-action);
		color: var(--color-text-inverse);
	}

	.bank_offer .stub {
		background: var(--color-dark);
		color: var(--color-text-inverse);
	}

	/* Saffron is for offers - always with Ink text */
	.free_delivery .stub {
		background: var(--color-accent);
		color: var(--color-text);
		border-right-color: color-mix(in srgb, var(--color-dark) 25%, transparent);
	}

	.bogo .stub {
		background: var(--color-tint);
		color: var(--color-action);
		border-right-color: color-mix(in srgb, var(--color-primary) 40%, transparent);
	}

	.bank-tag {
		display: inline-flex;
		align-items: center;
		align-self: flex-start;
		gap: 6px;
		height: 28px;
		padding: 0 10px;
		border-radius: var(--radius-pill);
		background: var(--color-surface);
		color: var(--color-text);
		font-size: var(--text-caption);
		letter-spacing: var(--ls-caption);
	}

	.body {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
		min-width: 0;
		padding: var(--space-2) var(--space-2) var(--space-1) var(--space-3);
	}

	.top {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-1);
	}

	.type,
	.conditions,
	.validity {
		color: var(--color-text-muted);
		font-size: var(--text-caption);
		line-height: var(--lh-caption);
		letter-spacing: var(--ls-caption);
	}

	.title {
		font-size: var(--text-body);
		line-height: var(--lh-body);
	}

	.conditions {
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.validity {
		display: flex;
		align-items: center;
		gap: var(--space-1);
	}

	.actions {
		display: flex;
		align-items: center;
		margin-top: auto;
		padding-top: var(--space-1);
	}

	.spacer {
		flex: 1;
	}

	.paused .stub {
		opacity: 0.55;
	}

	/* Expired: visually muted */
	.expired .stub {
		background: var(--color-stone-tint);
		color: var(--color-text-muted);
		border-right-color: var(--color-border-strong);
	}

	.expired .bank-tag {
		background: var(--color-surface);
		color: var(--color-text-muted);
	}

	.expired .title {
		color: var(--color-text-muted);
	}

	@media (max-width: 479px) {
		.ticket {
			--stub-width: 38%;
		}

		.stub {
			padding: var(--space-2);
		}

		.body {
			padding-left: var(--space-2);
		}

		.headline {
			font-size: 24px;
			line-height: 30px;
		}
	}
</style>
