<script lang="ts">
	import Clock from '@lucide/svelte/icons/clock';
	import MapPin from '@lucide/svelte/icons/map-pin';
	import MessageSquareText from '@lucide/svelte/icons/message-square-text';
	import Phone from '@lucide/svelte/icons/phone';
	import SearchX from '@lucide/svelte/icons/search-x';
	import User from '@lucide/svelte/icons/user';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import Badge from '$lib/components/ui/Badge.svelte';
	import Drawer from '$lib/components/ui/Drawer.svelte';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';
	import ErrorState from '$lib/components/ui/ErrorState.svelte';
	import Skeleton from '$lib/components/ui/Skeleton.svelte';
	import StatusBadge from '$lib/components/ui/StatusBadge.svelte';
	import { ordersService } from '$lib/services';
	import { clock } from '$lib/stores/clock.svelte';
	import { ACTIVE_STATUSES, type OrderDetail } from '$lib/types';
	import { formatDateTime, formatSerial, formatTime, formatTimeAgo, pluralize } from '$lib/utils/format';
	import AmountBreakdown from './AmountBreakdown.svelte';
	import OrderActions from './OrderActions.svelte';
	import OrderItems from './OrderItems.svelte';
	import {
		FULFILLMENT_META,
		REFUND_LABELS,
		REJECT_REASON_LABELS,
		STATUS_HINTS,
		isUrgent,
		timingNote
	} from './status-meta';

	/** Opened from anywhere with ?order=<id>, so it works from Home and Previous Orders alike. */
	const orderId = $derived(page.url.searchParams.get('order'));

	let order = $state<OrderDetail | null>(null);
	let loading = $state(false);
	let error = $state<Error | null>(null);
	let attempt = $state(0);

	// Live: status changes from this device, other devices or the backend show up straight away.
	$effect(() => {
		const id = orderId;
		void attempt;
		if (!id) return;
		order = null;
		loading = true;
		error = null;
		return ordersService.watchOrder(
			id,
			(next) => {
				order = next;
				loading = false;
				error = null;
			},
			(e) => {
				error = e;
				loading = false;
			}
		);
	});

	const isActive = $derived(order ? ACTIVE_STATUSES.includes(order.status) : false);
	const timing = $derived(order && isActive ? timingNote(order, clock.now.getTime()) : '');
	const fulfillment = $derived(order ? FULFILLMENT_META[order.fulfillment] : null);

	function close() {
		const url = new URL(page.url);
		url.searchParams.delete('order');
		goto(`${url.pathname}${url.search}`, { noScroll: true, keepFocus: true });
	}
</script>

{#snippet footer()}
	{#if order && isActive}
		<OrderActions {order} />
	{:else if order}
		<p class="hint">{STATUS_HINTS[order.status]}</p>
	{/if}
{/snippet}

<Drawer
	open={!!orderId}
	eyebrow="Order"
	title={order ? formatSerial(order.serialNo) : 'Order details'}
	onclose={close}
	footer={order ? footer : undefined}
>
	{#snippet headerExtra()}
		{#if order}<StatusBadge status={order.status} size="md" />{/if}
	{/snippet}

	{#if order && fulfillment}
		<div class="sections">
			<section class="meta" aria-label="Timing">
				<p class="meta-row">
					<Clock size={20} strokeWidth={2} aria-hidden="true" />
					<span>
						Placed {formatDateTime(order.placedAt)}
						{#if isActive}<span class="muted">({formatTimeAgo(order.placedAt, clock.now)})</span>{/if}
					</span>
				</p>
				<p class="meta-row">
					<Badge tone="dark-outline" icon={fulfillment.icon}>{fulfillment.label}</Badge>
					{#if timing}
						<span class:urgent={isUrgent(order, clock.now.getTime())}>{timing}</span>
					{/if}
				</p>
				{#if order.pickedUpAt}
					<p class="meta-row muted">Left the kitchen at {formatTime(order.pickedUpAt)}</p>
				{/if}
				{#if order.rejectReason}
					<p class="meta-row muted">
						Rejected: {REJECT_REASON_LABELS[order.rejectReason]}{order.rejectNote ? `. "${order.rejectNote}"` : ''}
					</p>
				{/if}
				{#if order.cancelReason}
					<p class="meta-row muted">Cancelled: "{order.cancelReason}"</p>
				{/if}
				{#if order.refundStatus}
					<p class="meta-row"><Badge tone="muted-outline">{REFUND_LABELS[order.refundStatus]}</Badge></p>
				{/if}
			</section>

			<section class="customer" aria-labelledby="customer-heading">
				<h3 id="customer-heading" class="section-title">Customer</h3>
				<p class="meta-row"><User size={20} strokeWidth={2} aria-hidden="true" />{order.customer.name}</p>
				{#if order.customer.phone}
					<p class="meta-row">
						<Phone size={20} strokeWidth={2} aria-hidden="true" />
						<a href="tel:{order.customer.phone.replace(/\s/g, '')}">{order.customer.phone}</a>
					</p>
				{/if}
				{#if order.customer.address}
					<p class="meta-row">
						<MapPin size={20} strokeWidth={2} aria-hidden="true" />
						<span>
							{order.customer.address}
							{#if order.customer.addressNote}<span class="muted">· {order.customer.addressNote}</span>{/if}
						</span>
					</p>
				{/if}
			</section>

			{#if order.note}
				<section class="note" aria-label="Note from the customer">
					<MessageSquareText size={20} strokeWidth={2} aria-hidden="true" />
					<p>{order.note}</p>
				</section>
			{/if}

			<section aria-labelledby="items-heading">
				<h3 id="items-heading" class="section-title">{pluralize(order.itemCount, 'item')}</h3>
				<OrderItems lines={order.lines} />
			</section>

			<section aria-labelledby="amount-heading">
				<h3 id="amount-heading" class="section-title">Amount</h3>
				<AmountBreakdown {order} />
			</section>
		</div>
	{:else if error}
		<ErrorState what="this order" onretry={() => attempt++} />
	{:else if loading}
		<div class="sections" aria-busy="true">
			<Skeleton height="20px" width="60%" />
			<Skeleton height="120px" radius="card" />
			<Skeleton height="180px" radius="card" />
			<Skeleton height="160px" radius="card" />
		</div>
	{:else}
		<EmptyState
			icon={SearchX}
			title="We couldn't find that order"
			description="It may belong to another restaurant, or the link is wrong."
		/>
	{/if}
</Drawer>

<style>
	.sections {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}

	.meta,
	.customer {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
	}

	.customer {
		padding: var(--space-2) var(--space-3);
		border-radius: var(--radius-card);
		background: var(--color-bg);
		border: 1px solid var(--color-border);
	}

	.meta-row {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: var(--space-1);
	}

	.meta-row :global(svg) {
		flex: none;
		color: var(--color-text-muted);
	}

	.urgent {
		color: var(--color-action);
	}

	.note {
		display: flex;
		align-items: flex-start;
		gap: var(--space-1);
		padding: var(--space-2);
		border-radius: var(--radius-card);
		background: var(--color-tint);
	}

	.note :global(svg) {
		flex: none;
		margin-top: 2px;
		color: var(--color-action);
	}

	.section-title {
		margin-bottom: var(--space-2);
		color: var(--color-text-muted);
		font-size: var(--text-caption);
		line-height: var(--lh-caption);
		letter-spacing: var(--ls-caption);
	}

	.customer .section-title {
		margin-bottom: var(--space-half);
	}

	.hint {
		flex: 1;
		align-self: center;
		color: var(--color-text-muted);
		font-size: var(--text-caption);
		letter-spacing: var(--ls-caption);
	}
</style>
