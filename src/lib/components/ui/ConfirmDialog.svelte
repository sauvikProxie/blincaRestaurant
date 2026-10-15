<script lang="ts">
	import Button from './Button.svelte';
	import Modal from './Modal.svelte';

	interface Props {
		open: boolean;
		title: string;
		body: string;
		confirmLabel: string;
		cancelLabel?: string;
		busy?: boolean;
		onconfirm: () => void;
		oncancel: () => void;
	}

	let { open, title, body, confirmLabel, cancelLabel = 'Cancel', busy = false, onconfirm, oncancel }: Props =
		$props();
</script>

<Modal {open} {title} size="sm" onclose={oncancel}>
	<p class="muted">{body}</p>
	{#snippet footer()}
		<Button variant="secondary" onclick={oncancel} disabled={busy}>{cancelLabel}</Button>
		<Button onclick={onconfirm} loading={busy}>{confirmLabel}</Button>
	{/snippet}
</Modal>
