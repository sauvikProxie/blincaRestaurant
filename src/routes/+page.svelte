<script lang="ts">
	import FlaskConical from '@lucide/svelte/icons/flask-conical';
	import { PUBLIC_DEV_TOOLS } from '$env/static/public';
	import ActiveOrdersTable from '$lib/components/home/ActiveOrdersTable.svelte';
	import StatusCard from '$lib/components/home/StatusCard.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import PageHeader from '$lib/components/ui/PageHeader.svelte';
	import { errorMessage } from '$lib/convex/errors';
	import { ordersService } from '$lib/services';
	import { clock } from '$lib/stores/clock.svelte';
	import { liveOrders } from '$lib/stores/live-orders.svelte';
	import { toasts } from '$lib/stores/toasts.svelte';
	import { formatDate, formatWeekday, pluralize } from '$lib/utils/format';
	import { stockholmParts } from '$lib/utils/stockholm-time';

	const devTools = PUBLIC_DEV_TOOLS === 'true';

	const greeting = $derived.by(() => {
		const hour = stockholmParts(clock.now.getTime()).hour;
		if (hour < 5) return 'Working late';
		if (hour < 12) return 'Good morning';
		if (hour < 17) return 'Good afternoon';
		return 'Good evening';
	});

	let simulating = $state(false);

	/** Dev deployments only: the backend places a paid test order from the live menu. */
	async function simulate() {
		simulating = true;
		try {
			await ordersService.simulate();
		} catch (error) {
			toasts.error(errorMessage(error));
		} finally {
			simulating = false;
		}
	}
</script>

<svelte:head><title>Home - Blinca</title></svelte:head>

<PageHeader title={greeting} description="{formatWeekday(clock.now)}, {formatDate(clock.now)}. Here's what's cooking.">
	{#snippet actions()}
		{#if devTools}
			<Button variant="secondary" size="sm" icon={FlaskConical} loading={simulating} onclick={simulate}>
				Simulate order
			</Button>
		{/if}
	{/snippet}
</PageHeader>

<div class="stack">
	<StatusCard />

	<section aria-labelledby="active-heading">
		<div class="section-head">
			<h2 id="active-heading" class="text-h2">Active orders</h2>
			{#if !liveOrders.loading && !liveOrders.error}
				<p class="muted live">
					<span class="pulse" aria-hidden="true"></span>
					{pluralize(liveOrders.orders.length, 'order')} in progress{liveOrders.newCount
						? `, ${liveOrders.newCount} waiting for you`
						: ''}. Updates live.
				</p>
			{/if}
		</div>
		<ActiveOrdersTable />
	</section>
</div>

<style>
	.stack {
		display: flex;
		flex-direction: column;
		gap: var(--space-5);
	}

	.section-head {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		flex-wrap: wrap;
		gap: var(--space-1) var(--space-2);
		margin-bottom: var(--space-2);
	}

	.live {
		display: inline-flex;
		align-items: center;
		gap: var(--space-1);
		font-size: var(--text-caption);
		letter-spacing: var(--ls-caption);
	}

	.pulse {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: var(--color-primary);
		animation: pulse 1.8s ease-in-out infinite;
	}

	@keyframes pulse {
		50% {
			opacity: 0.3;
		}
	}
</style>
