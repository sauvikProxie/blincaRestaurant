<script lang="ts">
	import Button from '$lib/components/ui/Button.svelte';
	import { errorMessage } from '$lib/convex/errors';
	import { ordersService } from '$lib/services';
	import { liveOrders } from '$lib/stores/live-orders.svelte';
	import { restaurant } from '$lib/stores/restaurant.svelte';
	import { toasts } from '$lib/stores/toasts.svelte';
	import { DELAY_MINUTES, PREP_MINUTES, type OrderDetail, type RejectInput } from '$lib/types';
	import { formatSerial } from '$lib/utils/format';
	import MinutesDialog from './MinutesDialog.svelte';
	import RejectDialog from './RejectDialog.svelte';

	let { order }: { order: OrderDetail } = $props();

	const busy = $derived(liveOrders.pending.includes(order.id));
	const serial = $derived(formatSerial(order.serialNo));
	let dialog = $state<'accept' | 'reject' | 'delay' | null>(null);
	let running = $state<string | null>(null);

	/** The restaurant's usual prep time, snapped to the nearest choice the backend allows. */
	const suggestedPrep = $derived.by(() => {
		const usual = restaurant.info?.prepTimeMinutes ?? 20;
		return PREP_MINUTES.reduce((best, m) => (Math.abs(m - usual) < Math.abs(best - usual) ? m : best));
	});

	async function act(key: string, work: () => Promise<void>, done: string) {
		running = key;
		try {
			await liveOrders.run(order.id, work);
			toasts.success(done);
			dialog = null;
		} catch (error) {
			toasts.error(errorMessage(error));
		} finally {
			running = null;
		}
	}

	function accept() {
		// Pre-orders already have a time: the backend works out when they must be ready.
		if (order.scheduledFor) {
			act('accept', () => ordersService.accept(order.id), `Got it. ${serial} is accepted.`);
		} else {
			dialog = 'accept';
		}
	}

	const acceptWith = (minutes: number) =>
		act('accept', () => ordersService.accept(order.id, minutes), `Got it. ${serial} will be ready in ${minutes} min.`);

	const reject = (input: RejectInput) =>
		act('reject', () => ordersService.reject(order.id, input), `${serial} was rejected. We've told the customer.`);

	const delay = (minutes: number) =>
		act('delay', () => ordersService.delay(order.id, minutes), `Added ${minutes} min to ${serial}.`);

	const markReady = () =>
		act(
			'ready',
			() => ordersService.markReady(order.id),
			order.fulfillment === 'delivery' ? `${serial} is ready. We've let the rider know.` : `${serial} is ready for the customer.`
		);

	const handOver = () => act('handOver', () => ordersService.handOver(order.id), `${serial} has left the kitchen.`);
</script>

{#if order.status === 'new'}
	<Button variant="secondary" disabled={busy} onclick={() => (dialog = 'reject')}>Reject</Button>
	<Button loading={running === 'accept' && !dialog} disabled={busy} onclick={accept}>Accept</Button>
{:else if order.status === 'accepted'}
	<Button variant="secondary" disabled={busy} onclick={() => (dialog = 'delay')}>Add time</Button>
	<Button loading={running === 'ready'} disabled={busy} onclick={markReady}>Mark ready</Button>
{:else if order.status === 'ready'}
	<Button loading={running === 'handOver'} disabled={busy} onclick={handOver}>
		{order.fulfillment === 'delivery' ? 'Handed to rider' : 'Collected by customer'}
	</Button>
{/if}

<MinutesDialog
	open={dialog === 'accept'}
	title="Accept {serial}"
	body="How long until it's ready? The customer sees this time."
	options={PREP_MINUTES}
	initial={suggestedPrep}
	confirmLabel="Accept order"
	busy={running === 'accept'}
	onconfirm={acceptWith}
	oncancel={() => (dialog = null)}
/>

<MinutesDialog
	open={dialog === 'delay'}
	title="Add time to {serial}"
	body="We'll update the ready time and let the customer know."
	options={DELAY_MINUTES}
	initial={DELAY_MINUTES[0]}
	confirmLabel="Add time"
	busy={running === 'delay'}
	onconfirm={delay}
	oncancel={() => (dialog = null)}
/>

<RejectDialog
	open={dialog === 'reject'}
	{order}
	busy={running === 'reject'}
	onconfirm={reject}
	oncancel={() => (dialog = null)}
/>
