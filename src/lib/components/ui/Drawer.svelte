<script lang="ts">
	import type { Snippet } from 'svelte';
	import Dialog from './Dialog.svelte';

	interface Props {
		open: boolean;
		title: string;
		eyebrow?: string;
		onclose: () => void;
		headerExtra?: Snippet;
		footer?: Snippet;
		children: Snippet;
	}

	let { open, title, eyebrow, onclose, headerExtra, footer, children }: Props = $props();
</script>

<Dialog variant="drawer" {open} {title} {eyebrow} {onclose} {headerExtra} {footer}>{@render children()}</Dialog>
