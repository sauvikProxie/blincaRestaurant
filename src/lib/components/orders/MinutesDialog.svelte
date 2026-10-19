<script lang="ts">
	import Button from '$lib/components/ui/Button.svelte';
	import Chip from '$lib/components/ui/Chip.svelte';
	import Modal from '$lib/components/ui/Modal.svelte';

	interface Props {
		open: boolean;
		title: string;
		body: string;
		/** Choices in minutes, as the backend allows them. */
		options: readonly number[];
		/** Pre-selected choice. */
		initial: number;
		confirmLabel: string;
		busy?: boolean;
		onconfirm: (minutes: number) => void;
		oncancel: () => void;
	}

	let { open, title, body, options, initial, confirmLabel, busy = false, onconfirm, oncancel }: Props = $props();

	let selected = $state(0);

	// Every time it opens, start from the suggested value.
	$effect(() => {
		if (open) selected = initial;
	});
</script>

<Modal {open} {title} size="sm" onclose={oncancel}>
	<p class="muted">{body}</p>
	<div class="choices" role="group" aria-label={title}>
		{#each options as minutes (minutes)}
			<Chip selected={selected === minutes} onclick={() => (selected = minutes)}>{minutes} min</Chip>
		{/each}
	</div>
	{#snippet footer()}
		<Button variant="secondary" onclick={oncancel} disabled={busy}>Cancel</Button>
		<Button onclick={() => onconfirm(selected)} loading={busy}>{confirmLabel}</Button>
	{/snippet}
</Modal>

<style>
	.choices {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-1);
		margin-top: var(--space-3);
	}
</style>
