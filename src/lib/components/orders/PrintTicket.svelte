<script lang="ts">
	import { FULFILLMENT_META } from '$lib/components/orders/status-meta';
	import { printer } from '$lib/stores/printer.svelte';
	import { formatMoney, formatSerial, formatTime } from '$lib/utils/format';
</script>

<!-- Only ever visible on paper: app.css hides the screen and shows this when printing. -->
<div class="print-area" aria-hidden="true">
	{#if printer.ticket}
		{@const t = printer.ticket}
		<article class="ticket">
			<p class="center">{t.restaurantName}</p>
			<h1 class="center number">{formatSerial(t.serialNo)}</h1>
			<p class="center strong upper">{FULFILLMENT_META[t.fulfillment].label} · {t.customerFirstName}</p>
			<p class="center">{t.scheduledFor ? `Scheduled for ${formatTime(t.scheduledFor)}` : `Paid ${formatTime(t.paidAt)}`}</p>
			<hr />
			{#each t.lines as line, index (index)}
				<div class="line">
					<p class="strong">{line.quantity} × {line.name}{line.variantName ? ` (${line.variantName})` : ''}</p>
					{#each line.options as option, optionIndex (optionIndex)}
						<p class="indent">+ {option.quantity > 1 ? `${option.quantity} × ` : ''}{option.name}</p>
					{/each}
					{#if line.note}<p class="indent italic">» {line.note}</p>{/if}
				</div>
			{/each}
			<hr />
			{#if t.note}
				<p class="strong">Customer note:</p>
				<p>{t.note}</p>
			{/if}
			{#if t.address}
				<p class="spaced">{t.address}</p>
				{#if t.addressNote}<p>{t.addressNote}</p>{/if}
			{/if}
			<p class="total strong">Total {formatMoney(t.total)}</p>
		</article>
	{/if}
</div>

<style>
	.print-area {
		display: none;
	}

	@media print {
		@page {
			size: 80mm auto;
			margin: 4mm;
		}

		.print-area {
			display: block;
			color: #000;
			background: #fff;
		}
	}

	/* Receipt printers are 80 mm wide with ~72 mm printable */
	.ticket {
		width: 72mm;
		font-family: ui-monospace, Menlo, Consolas, monospace;
		font-size: 12pt;
		line-height: 1.3;
	}

	.center {
		text-align: center;
	}

	.number {
		font-size: 28pt;
		font-weight: 700;
	}

	.strong {
		font-weight: 700;
	}

	.upper {
		text-transform: uppercase;
	}

	.italic {
		font-style: italic;
	}

	.indent {
		padding-left: 4mm;
	}

	.line {
		margin-bottom: 1mm;
	}

	.spaced {
		margin-top: 1mm;
	}

	.total {
		margin-top: 2mm;
		text-align: right;
	}

	hr {
		margin: 2mm 0;
		border: 0;
		border-top: 1px dashed #000;
	}
</style>
