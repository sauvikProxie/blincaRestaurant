<script lang="ts">
	import type { LucideIcon } from '@lucide/svelte';
	import Banknote from '@lucide/svelte/icons/banknote';
	import Gift from '@lucide/svelte/icons/gift';
	import Landmark from '@lucide/svelte/icons/landmark';
	import Percent from '@lucide/svelte/icons/percent';
	import Truck from '@lucide/svelte/icons/truck';
	import { addDays } from 'date-fns';
	import Button from '$lib/components/ui/Button.svelte';
	import Modal from '$lib/components/ui/Modal.svelte';
	import Toggle from '$lib/components/ui/Toggle.svelte';
	import { DISCOUNT_TYPES, type Discount, type DiscountInput, type DiscountType } from '$lib/types';
	import { DISCOUNT_TYPE_LABELS, isPercentType, validateDiscount } from '$lib/utils/discounts';
	import { toISODate, toMajor, toMinor } from '$lib/utils/format';

	interface Props {
		open: boolean;
		/** The discount being edited; null to create a new one. */
		discount: Discount | null;
		saving: boolean;
		onsave: (input: DiscountInput) => void;
		onclose: () => void;
	}

	let { open, discount, saving, onsave, onclose }: Props = $props();

	const TYPE_ICONS: Record<DiscountType, LucideIcon> = {
		percentage: Percent,
		flat: Banknote,
		bank_offer: Landmark,
		free_delivery: Truck,
		bogo: Gift
	};

	const BANKS = ['SEB', 'Swedbank', 'Handelsbanken', 'Nordea', 'Danske Bank', 'ICA Banken'];

	/** Text fields so empty inputs stay empty instead of turning into 0. */
	interface FormValues {
		type: DiscountType;
		title: string;
		value: string;
		minOrder: string;
		maxDiscount: string;
		bankName: string;
		validFrom: string;
		validTo: string;
		isActive: boolean;
	}

	function initialValues(source: Discount | null): FormValues {
		if (!source) {
			const today = new Date();
			return {
				type: 'percentage',
				title: '',
				value: '',
				minOrder: '',
				maxDiscount: '',
				bankName: '',
				validFrom: toISODate(today),
				validTo: toISODate(addDays(today, 30)),
				isActive: true
			};
		}
		const money = (minor: number) => (minor ? String(toMajor(minor)) : '');
		return {
			type: source.type,
			title: source.title,
			value: source.type === 'flat' ? money(source.value) : source.value ? String(source.value) : '',
			minOrder: money(source.minOrder),
			maxDiscount: money(source.maxDiscount),
			bankName: source.bankName ?? '',
			validFrom: source.validFrom,
			validTo: source.validTo,
			isActive: source.isActive
		};
	}

	let values = $state<FormValues>(initialValues(null));
	let submitted = $state(false);

	// Reset whenever the form opens, for a new or a different discount.
	$effect(() => {
		if (open) {
			values = initialValues(discount);
			submitted = false;
		}
	});

	const number = (text: string) => (text.trim() === '' ? 0 : Number(text.replace(',', '.')));

	function toInput(form: FormValues): DiscountInput {
		const percent = isPercentType(form.type);
		return {
			type: form.type,
			title: form.title.trim(),
			value: percent ? number(form.value) : form.type === 'flat' ? toMinor(number(form.value)) : 0,
			minOrder: toMinor(number(form.minOrder)),
			maxDiscount: percent ? toMinor(number(form.maxDiscount)) : 0,
			bankName: form.type === 'bank_offer' ? form.bankName.trim() : undefined,
			validFrom: form.validFrom,
			validTo: form.validTo,
			isActive: form.isActive
		};
	}

	const errors = $derived(submitted ? validateDiscount(toInput(values)) : {});

	function submit(event: SubmitEvent) {
		event.preventDefault();
		submitted = true;
		const input = toInput(values);
		if (Object.keys(validateDiscount(input)).length) return;
		onsave(input);
	}

	const percent = $derived(isPercentType(values.type));
</script>

<Modal {open} title={discount ? 'Edit discount' : 'Create discount'} size="lg" {onclose}>
	<form id="discount-form" class="form" novalidate onsubmit={submit}>
		<fieldset class="types">
			<legend class="field-label">Type of offer</legend>
			<div class="type-options">
				{#each DISCOUNT_TYPES as type (type)}
					{@const Icon = TYPE_ICONS[type]}
					<label class="type-option" class:selected={values.type === type}>
						<input type="radio" name="type" value={type} bind:group={values.type} class="visually-hidden" />
						<Icon size={20} strokeWidth={2} aria-hidden="true" />
						{DISCOUNT_TYPE_LABELS[type]}
					</label>
				{/each}
			</div>
		</fieldset>

		<div class="field full">
			<label class="field-label" for="d-title">Name customers will see</label>
			<input
				id="d-title"
				class="input"
				bind:value={values.title}
				placeholder="e.g. Lunch deal"
				aria-invalid={!!errors.title}
				aria-describedby={errors.title ? 'd-title-error' : undefined}
			/>
			{#if errors.title}<p id="d-title-error" class="field-error">{errors.title}</p>{/if}
		</div>

		{#if values.type === 'bank_offer'}
			<div class="field full">
				<label class="field-label" for="d-bank">Bank</label>
				<input
					id="d-bank"
					class="input"
					list="d-bank-list"
					bind:value={values.bankName}
					placeholder="e.g. SEB"
					aria-invalid={!!errors.bankName}
					aria-describedby={errors.bankName ? 'd-bank-error' : undefined}
				/>
				<datalist id="d-bank-list">
					{#each BANKS as bank (bank)}<option value={bank}></option>{/each}
				</datalist>
				{#if errors.bankName}<p id="d-bank-error" class="field-error">{errors.bankName}</p>{/if}
			</div>
		{/if}

		{#if percent || values.type === 'flat'}
			<div class="field">
				<label class="field-label" for="d-value">{percent ? 'Discount (%)' : 'Amount off (kr)'}</label>
				<input
					id="d-value"
					class="input"
					type="text"
					inputmode="decimal"
					bind:value={values.value}
					aria-invalid={!!errors.value}
					aria-describedby={errors.value ? 'd-value-error' : undefined}
				/>
				{#if errors.value}<p id="d-value-error" class="field-error">{errors.value}</p>{/if}
			</div>
		{/if}

		{#if percent}
			<div class="field">
				<label class="field-label" for="d-max">Maximum discount (kr)</label>
				<input
					id="d-max"
					class="input"
					type="text"
					inputmode="decimal"
					bind:value={values.maxDiscount}
					placeholder="No cap"
					aria-invalid={!!errors.maxDiscount}
				/>
				{#if errors.maxDiscount}<p class="field-error">{errors.maxDiscount}</p>{/if}
			</div>
		{/if}

		<div class="field">
			<label class="field-label" for="d-min">Minimum order (kr)</label>
			<input
				id="d-min"
				class="input"
				type="text"
				inputmode="decimal"
				bind:value={values.minOrder}
				placeholder="No minimum"
				aria-invalid={!!errors.minOrder}
			/>
			{#if errors.minOrder}<p class="field-error">{errors.minOrder}</p>{/if}
		</div>

		<div class="field">
			<label class="field-label" for="d-from">Starts</label>
			<input
				id="d-from"
				class="input"
				type="date"
				bind:value={values.validFrom}
				aria-invalid={!!errors.validFrom}
			/>
			{#if errors.validFrom}<p class="field-error">{errors.validFrom}</p>{/if}
		</div>

		<div class="field">
			<label class="field-label" for="d-to">Ends</label>
			<input
				id="d-to"
				class="input"
				type="date"
				bind:value={values.validTo}
				min={values.validFrom}
				aria-invalid={!!errors.validTo}
				aria-describedby={errors.validTo ? 'd-to-error' : undefined}
			/>
			{#if errors.validTo}<p id="d-to-error" class="field-error">{errors.validTo}</p>{/if}
		</div>

		<div class="full active">
			<Toggle
				checked={values.isActive}
				label={values.isActive ? 'Active as soon as it starts' : 'Paused - you can switch it on later'}
				onchange={(checked) => (values.isActive = checked)}
			/>
		</div>
	</form>

	{#snippet footer()}
		<Button variant="secondary" onclick={onclose} disabled={saving}>Cancel</Button>
		<Button type="submit" form="discount-form" loading={saving}>
			{discount ? 'Save changes' : 'Create discount'}
		</Button>
	{/snippet}
</Modal>

<style>
	.form {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: var(--space-2) var(--space-3);
	}

	.full,
	.types {
		grid-column: 1 / -1;
	}

	.types {
		margin: 0;
		padding: 0;
		border: 0;
	}

	.types legend {
		margin-bottom: var(--space-1);
	}

	.type-options {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-1);
	}

	.type-option {
		display: inline-flex;
		align-items: center;
		gap: var(--space-1);
		height: var(--control-height-sm);
		padding: 0 var(--space-2);
		border: 1px solid var(--color-border-strong);
		border-radius: var(--radius-pill);
		cursor: pointer;
		white-space: nowrap;
		transition: background-color var(--duration) var(--ease);
	}

	.type-option:hover {
		background: var(--color-hover);
	}

	.type-option.selected {
		background: var(--color-tint);
		border-color: var(--color-primary);
		color: var(--color-action);
	}

	.type-option:has(:focus-visible) {
		outline: 2px solid var(--color-focus);
		outline-offset: 2px;
	}

	.active {
		padding-top: var(--space-1);
	}

	@media (max-width: 559px) {
		.form {
			grid-template-columns: 1fr;
		}
	}
</style>
