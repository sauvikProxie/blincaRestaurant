<script lang="ts">
	import '../app.css';
	import { onMount, untrack, type Snippet } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import appIcon from '$brand/02-App-Icon/blinca-app-icon-rounded-1024.png';
	import AppShell from '$lib/components/layout/AppShell.svelte';
	import OrderDetailDrawer from '$lib/components/orders/OrderDetailDrawer.svelte';
	import Toaster from '$lib/components/ui/Toaster.svelte';
	import { auth } from '$lib/stores/auth.svelte';
	import { clock } from '$lib/stores/clock.svelte';
	import { liveOrders } from '$lib/stores/live-orders.svelte';
	import { restaurant } from '$lib/stores/restaurant.svelte';

	let { children }: { children: Snippet } = $props();

	// The sign-in page stands on its own, without the header and sidebar.
	const bare = $derived(page.route.id === '/login');

	onMount(() => {
		clock.start();
		return () => clock.stop();
	});

	// Live restaurant data and the order board only run while someone is signed in.
	$effect(() => {
		if (!auth.session) return;
		untrack(() => {
			auth.connect();
			restaurant.connect();
			liveOrders.connect();
		});
		return () => {
			liveOrders.disconnect();
			restaurant.disconnect();
		};
	});

	// The session can end without a navigation (signed out elsewhere, or expired): back to sign-in.
	$effect(() => {
		if (auth.session || bare) return;
		const target = untrack(() => page.url.pathname + page.url.search);
		goto(`/login?redirectTo=${encodeURIComponent(target)}`, { replaceState: true });
	});
</script>

<svelte:head>
	<link rel="icon" type="image/png" href={appIcon} />
</svelte:head>

{#if bare}
	{@render children()}
{:else}
	<AppShell>
		{@render children()}
	</AppShell>

	<OrderDetailDrawer />
{/if}
<Toaster />
