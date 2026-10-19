<script lang="ts">
	import Button from '$lib/components/ui/Button.svelte';
	import Chip from '$lib/components/ui/Chip.svelte';
	import Modal from '$lib/components/ui/Modal.svelte';
	import { REJECT_REASONS, type OrderDetail, type RejectInput, type RejectReason, type StockTarget } from '$lib/types';
	import { REJECT_REASON_LABELS } from './status-meta';

	interface Props {
		open: boolean;
		order: OrderDetail;
		busy?: boolean;
		onconfirm: (input: RejectInput) => void;
		oncancel: () => void;
	}

	let { open, order, busy = false, onconfirm, oncancel }: Props = $props();

	/** The backend caps notes at 200 characters. */
	const MAX_NOTE = 200;

	let reason = $state<RejectReason | null>(null);
	let note = $state('');
	let picked = $state<Record<string, boolean>>({});

	$effect(() => {
		if (!open) return;
		reason = null;
		note = '';
		picked = {};
	});

	/** One checkbox per item, size and extra in the order; ticked ones are marked sold out for today. */
	const choices = $derived.by(() => {
		const seen: Record<string, { key: string; label: string; target: StockTarget }> = {};
		for (const line of order.lines) {
			if (line.menuItemId) {
				seen[`item:${line.menuItemId}`] = {
					key: `item:${line.menuItemId}`,
					label: line.name,
					target: { kind: 'item', id: line.menuItemId }
				};
			}
			if (line.variantId) {
				seen[`variant:${line.variantId}`] = {
					key: `variant:${line.variantId}`,
					label: `${line.name}, ${line.variantName ?? ''}`.trim(),
					target: { kind: 'variant', id: line.variantId }
				};
			}
			for (const option of line.options) {
				if (!option.optionId) continue;
				seen[`option:${option.optionId}`] = {
					key: `option:${option.optionId}`,
					label: option.name,
					target: { kind: 'option', id: option.optionId }
				};
			}
		}
		return Object.values(seen);
	});

	const targets = $derived(choices.filter((c) => picked[c.key]).map((c) => c.target));
	const valid = $derived(
		reason !== null &&
			(reason !== 'other' || note.trim() !== '') &&
			(reason !== 'item_unavailable' || targets.length > 0)
	);

	function submit() {
		if (!reason || !valid) return;
		onconfirm({
			reason,
			note: note.trim() || undefined,
			unavailable: reason === 'item_unavailable' ? targets : undefined
		});
	}
</script>

<Modal {open} title="Reject this order?" size="md" onclose={oncancel}>
	<div class="body">
		<p class="muted">We'll tell the customer and refund them straight away. This can't be undone.</p>

		<fieldset>
			<legend class="field-label">Reason</legend>
			<div class="choices">
				{#each REJECT_REASONS as option (option)}
					<Chip selected={reason === option} onclick={() => (reason = option)}>{REJECT_REASON_LABELS[option]}</Chip>
				{/each}
			</div>
		</fieldset>

		{#if reason === 'item_unavailable'}
			<fieldset>
				<legend class="field-label">What's unavailable? It's marked sold out for today.</legend>
				<div class="items">
					{#each choices as choice (choice.key)}
						<label class="item">
							<input type="checkbox" bind:checked={picked[choice.key]} />
							{choice.label}
						</label>
					{/each}
				</div>
			</fieldset>
		{/if}

		<div class="field">
			<label class="field-label" for="reject-note">
				{reason === 'other' ? 'What happened?' : 'Note for the customer (optional)'}
			</label>
			<textarea id="reject-note" class="input" rows="2" maxlength={MAX_NOTE} bind:value={note}></textarea>
		</div>
	</div>

	{#snippet footer()}
		<Button variant="secondary" onclick={oncancel} disabled={busy}>Keep order</Button>
		<Button onclick={submit} loading={busy} disabled={!valid}>Reject and refund</Button>
	{/snippet}
</Modal>

<style>
	.body {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}

	fieldset {
		margin: 0;
		padding: 0;
		border: 0;
	}

	legend {
		margin-bottom: var(--space-1);
	}

	.choices {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-1);
	}

	.items {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
	}

	.item {
		display: flex;
		align-items: center;
		gap: var(--space-1);
		min-height: 44px;
	}

	.item input {
		width: 20px;
		height: 20px;
		accent-color: var(--color-action);
	}

	textarea.input {
		height: auto;
		padding-block: var(--space-1);
		resize: vertical;
	}
</style>
