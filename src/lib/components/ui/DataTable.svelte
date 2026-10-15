<script lang="ts" module>
	export interface Column {
		key: string;
		label: string;
		align?: 'start' | 'end';
		sortable?: boolean;
		/** CSS width, e.g. "120px". */
		width?: string;
	}

	export interface SortState {
		key: string;
		dir: 'asc' | 'desc';
	}
</script>

<script lang="ts" generics="T">
	import ArrowDown from '@lucide/svelte/icons/arrow-down';
	import ArrowUp from '@lucide/svelte/icons/arrow-up';
	import ArrowUpDown from '@lucide/svelte/icons/arrow-up-down';
	import type { Snippet } from 'svelte';
	import ErrorState from './ErrorState.svelte';
	import Skeleton from './Skeleton.svelte';

	interface Props {
		/** Accessible table name. */
		caption: string;
		columns: Column[];
		rows: T[];
		rowKey: (row: T) => string;
		/** Makes the whole row a link (e.g. to open the order drawer). */
		rowHref?: (row: T) => string;
		rowLabel?: (row: T) => string;
		/** Emphasise a row, e.g. a brand new order. */
		rowHighlight?: (row: T) => boolean;
		cell: Snippet<[T, Column]>;
		loading?: boolean;
		error?: Error | null;
		/** What failed to load, used in the error message. */
		errorWhat?: string;
		onretry?: () => void;
		empty: Snippet;
		sort?: SortState;
		onsort?: (sort: SortState) => void;
		skeletonRows?: number;
	}

	let {
		caption,
		columns,
		rows,
		rowKey,
		rowHref,
		rowLabel,
		rowHighlight,
		cell,
		loading = false,
		error = null,
		errorWhat,
		onretry,
		empty,
		sort,
		onsort,
		skeletonRows = 5
	}: Props = $props();

	function toggleSort(column: Column) {
		if (!onsort) return;
		const dir = sort?.key === column.key && sort.dir === 'desc' ? 'asc' : 'desc';
		onsort({ key: column.key, dir });
	}

	function ariaSort(column: Column) {
		if (!column.sortable) return undefined;
		if (sort?.key !== column.key) return 'none';
		return sort.dir === 'asc' ? 'ascending' : 'descending';
	}
</script>

<div class="table-card">
	{#if error}
		<ErrorState what={errorWhat} onretry={() => onretry?.()} />
	{:else if !loading && rows.length === 0}
		{@render empty()}
	{:else}
		<table aria-busy={loading}>
			<caption class="visually-hidden">{caption}</caption>
			<thead>
				<tr>
					{#each columns as column (column.key)}
						<th
							scope="col"
							class:end={column.align === 'end'}
							style:width={column.width}
							aria-sort={ariaSort(column)}
						>
							{#if column.sortable && onsort}
								<button type="button" class="sort" onclick={() => toggleSort(column)}>
									{column.label}
									{#if sort?.key !== column.key}
										<ArrowUpDown size={16} strokeWidth={2} aria-hidden="true" />
									{:else if sort.dir === 'asc'}
										<ArrowUp size={16} strokeWidth={2} aria-hidden="true" />
									{:else}
										<ArrowDown size={16} strokeWidth={2} aria-hidden="true" />
									{/if}
								</button>
							{:else}
								{column.label}
							{/if}
						</th>
					{/each}
				</tr>
			</thead>
			<tbody>
				{#if loading}
					{#each { length: skeletonRows } as _, i (i)}
						<tr class="skeleton-row">
							{#each columns as column (column.key)}
								<td class:end={column.align === 'end'} data-label={column.label}>
									<Skeleton width={column.align === 'end' ? '64px' : '70%'} height="14px" />
								</td>
							{/each}
						</tr>
					{/each}
				{:else}
					{#each rows as row (rowKey(row))}
						<tr class:link-row={!!rowHref} class:highlight={rowHighlight?.(row)}>
							{#each columns as column, index (column.key)}
								<td class:end={column.align === 'end'} data-label={column.label}>
									{#if index === 0 && rowHref}
										<a
											class="row-link"
											href={rowHref(row)}
											aria-label={rowLabel?.(row)}
											data-sveltekit-noscroll
											data-sveltekit-keepfocus>{@render cell(row, column)}</a
										>
									{:else}
										{@render cell(row, column)}
									{/if}
								</td>
							{/each}
						</tr>
					{/each}
				{/if}
			</tbody>
		</table>
	{/if}
</div>

<style>
	.table-card {
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-card);
		overflow: hidden;
	}

	table {
		width: 100%;
		border-collapse: collapse;
	}

	th {
		height: 48px;
		padding: 0 var(--space-2);
		text-align: left;
		font-size: var(--text-caption);
		line-height: var(--lh-caption);
		letter-spacing: var(--ls-caption);
		color: var(--color-text-muted);
		border-bottom: 1px solid var(--color-border);
		white-space: nowrap;
	}

	th:first-child,
	td:first-child {
		padding-left: var(--space-3);
	}

	th:last-child,
	td:last-child {
		padding-right: var(--space-3);
	}

	.sort {
		display: inline-flex;
		align-items: center;
		gap: var(--space-half);
		padding: var(--space-half) 0;
		border: 0;
		background: none;
		color: inherit;
		font: inherit;
		letter-spacing: inherit;
	}

	.sort:hover,
	[aria-sort='ascending'] .sort,
	[aria-sort='descending'] .sort {
		color: var(--color-text);
	}

	td {
		height: 64px;
		padding: var(--space-1) var(--space-2);
		border-bottom: 1px solid var(--color-border);
		vertical-align: middle;
	}

	tbody tr:last-child td {
		border-bottom: 0;
	}

	.end {
		text-align: right;
	}

	th.end .sort {
		flex-direction: row-reverse;
	}

	/* Whole row is clickable through a stretched link in the first cell */
	.link-row {
		position: relative;
		transform: scale(1);
		transition: background-color var(--duration) var(--ease);
	}

	.link-row:hover,
	.link-row:focus-within {
		background: var(--color-hover);
	}

	.row-link {
		color: inherit;
		text-decoration: none;
	}

	.row-link::after {
		content: '';
		position: absolute;
		inset: 0;
	}

	.row-link:focus-visible {
		outline: none;
	}

	.row-link:focus-visible::after {
		outline: 2px solid var(--color-focus);
		outline-offset: -2px;
		border-radius: var(--radius-sm);
	}

	.highlight {
		animation: arrive 2.4s var(--ease);
	}

	@keyframes arrive {
		0%,
		40% {
			background: var(--color-tint);
		}
	}

	/* Phones: each row becomes a compact card */
	@media (max-width: 639px) {
		thead {
			display: none;
		}

		table,
		tbody,
		tr,
		td {
			display: block;
		}

		tr {
			padding: var(--space-2);
			border-bottom: 1px solid var(--color-border);
		}

		tbody tr:last-child {
			border-bottom: 0;
		}

		td,
		td:first-child,
		td:last-child {
			display: flex;
			align-items: center;
			justify-content: space-between;
			gap: var(--space-2);
			height: auto;
			min-height: 36px;
			padding: var(--space-half) 0;
			border: 0;
			text-align: right;
		}

		td::before {
			content: attr(data-label);
			color: var(--color-text-muted);
			font-size: var(--text-caption);
			letter-spacing: var(--ls-caption);
			text-align: left;
		}
	}
</style>
