<script lang="ts">
	import RefreshCw from '@lucide/svelte/icons/refresh-cw';
	import WifiOff from '@lucide/svelte/icons/wifi-off';
	import Button from './Button.svelte';
	import EmptyState from './EmptyState.svelte';

	interface Props {
		/** What failed to load, e.g. "your orders". */
		what?: string;
		onretry: () => void;
	}

	let { what = 'this', onretry }: Props = $props();
</script>

<!-- Honest and calm (brand voice): say what happened, then offer the fix. -->
<EmptyState
	tone="error"
	icon={WifiOff}
	title={`Sorry, we couldn't load ${what}`}
	description="Check your connection and try again. Nothing you saved is lost."
>
	{#snippet action()}
		<Button variant="secondary" icon={RefreshCw} onclick={onretry}>Try again</Button>
	{/snippet}
</EmptyState>
