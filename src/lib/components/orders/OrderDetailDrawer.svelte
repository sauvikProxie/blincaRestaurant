<script lang="ts">
	import Clock from '@lucide/svelte/icons/clock';
	import MapPin from '@lucide/svelte/icons/map-pin';
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
	import Stars from '$lib/components/ui/Stars.svelte';
	import StatusBadge from '$lib/components/ui/StatusBadge.svelte';
	import { ordersService } from '$lib/services';
	import { clock } from '$lib/stores/clock.svelte';
	import { liveOrders } from '$lib/stores/live-orders.svelte';
	import { PAST_STATUSES, type Order } from '$lib/types';
	import { formatDateTime, formatSerial, formatTime, formatTimeAgo, pluralize } from '$lib/utils/format';
	import { itemCount } from '$lib/utils/order-totals';
	import AmountBreakdown from './AmountBreakdown.svelte';
	import OrderActions from './OrderActions.svelte';
	import OrderItems from './OrderItems.svelte';
	import { NEXT_ACTIONS, STATUS_HINTS } from './status-meta';

	/** Opened from anywhere with ?order=<id>, so it works from Home and Previous Orders alike. */
	const orderId = $derived(page.url.searchParams.get('order'));
	const live = $derived(orderId ? liveOrders.orders.find((o) => o.id === orderId) : undefined);

	let snapshot = $state<Order | null>(null);
	let loading = $state(false);
	let error = $state<Error | null>(null);
	let request = 0;

	const order = $derived(live ?? (snapshot?.id === orderId ? snapshot : null));
	const isPast = $derived(order ? PAST_STATUSES.includes(order.status) : false);

	$effect(() => {
		const id = orderId;
		const liveOrder = live;
		if (!id) return;
		if (liveOrder) {
			snapshot = liveOrder;
			error = null;
			return;
		}
		load(id);
	});

	async function load(id: string) {
		const current = ++request;
		loading = true;
		error = null;
		try {
			const result = await ordersService.getById(id);
			if (current === request) snapshot = result;
		} catch (e) {
			if (current === request) error = e instanceof Error ? e : new Error(String(e));
		} finally {
			if (current === request) loading = false;
		}
	}

	function close() {
		const url = new URL(page.url);
		url.searchParams.delete('order');
		goto(`${url.pathname}${url.search}`, { noScroll: true, keepFocus: true });
	}
</script>

{#snippet footer()}
	{#if order && NEXT_ACTIONS[order.status]}
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
	footer={order && (NEXT_ACTIONS[order.status] || STATUS_HINTS[order.status]) ? footer : undefined}
>
	{#snippet headerExtra()}
		{#if order}<StatusBadge status={order.status} size="md" />{/if}
	{/snippet}

	{#if order}
		<div class="sections">
			<section class="meta" aria-label="Timing">
				<p class="meta-row">
					<Clock size={20} strokeWidth={2} aria-hidden="true" />
					<span>
						Placed {formatDateTime(order.placedAt)}
						{#if !isPast}<span class="muted">({formatTimeAgo(order.placedAt, clock.now)})</span>{/if}
					</span>
				</p>
				{#if order.deliveredAt}
					<p class="meta-row muted">
						Delivered at {formatTime(order.deliveredAt)}
						{#if order.isDelayed}<Badge tone="action-outline">Delayed</Badge>{/if}
					</p>
				{/if}
				{#if order.rating}
					<p class="meta-row">
						<Stars value={order.rating} size={18} />
						<span class="muted">Rated {order.rating} out of 5</span>
					</p>
				{/if}
			</section>

			<section class="customer" aria-labelledby="customer-heading">
				<h3 id="customer-heading" class="section-title">Customer</h3>
				<p class="meta-row"><User size={20} strokeWidth={2} aria-hidden="true" />{order.customer.name}</p>
				<p class="meta-row">
					<Phone size={20} strokeWidth={2} aria-hidden="true" />
					<a href="tel:{order.customer.phone.replace(/\s/g, '')}">{order.customer.phone}</a>
				</p>
				<p class="meta-row"><MapPin size={20} strokeWidth={2} aria-hidden="true" />{order.customer.address}</p>
			</section>

			<section aria-labelledby="items-heading">
				<h3 id="items-heading" class="section-title">{pluralize(itemCount(order.items), "item")}</h3>
				<OrderItems items={order.items} />
			</section>

			<section aria-labelledby="amount-heading">
				<h3 id="amount-heading" class="section-title">Amount</h3>
				<AmountBreakdown {order} />
			</section>

			{#if isPast}
				<p class="readonly">This order is complete, so it's read-only.</p>
			{/if}
		</div>
	{:else if error}
		<ErrorState what="this order" onretry={() => orderId && load(orderId)} />
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
			description="It may have been removed. Check the order number and try again."
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

	.readonly,
	.hint {
		color: var(--color-text-muted);
		font-size: var(--text-caption);
		letter-spacing: var(--ls-caption);
	}

	.hint {
		flex: 1;
		align-self: center;
	}
</style>
