<script lang="ts">
	import { STATUS_META } from '$lib/components/orders/status-meta';
	import type { OrderStatus } from '$lib/types';
	import Badge from './Badge.svelte';

	let { status, size = 'sm' }: { status: OrderStatus; size?: 'sm' | 'md' } = $props();

	const meta = $derived(STATUS_META[status]);
</script>

<Badge tone={meta.tone} icon={meta.icon} {size}>{meta.label}</Badge>
