<script lang="ts">
	import type { Snippet } from 'svelte';
	import Dialog from './Dialog.svelte';

	interface Props {
		open: boolean;
		title: string;
		size?: 'sm' | 'md' | 'lg';
		onclose: () => void;
		footer?: Snippet;
		children: Snippet;
	}

	let { open, title, size = 'md', onclose, footer, children }: Props = $props();
</script>

<Dialog variant="modal" {open} {title} {size} {onclose} {footer}>{@render children()}</Dialog>
