/**
 * Android and iOS webviews ignore window.print(), so tickets print from the
 * Windows, macOS and Linux builds only.
 */
export function canPrint(userAgent: string = globalThis.navigator?.userAgent ?? ''): boolean {
	return typeof globalThis.print === 'function' && !/Android|iPhone|iPad|iPod/i.test(userAgent);
}

/**
 * Orders that became accepted since the previous board snapshot, including
 * ones that arrive already accepted (auto-accept). `null` is the first load,
 * which prints nothing: opening the app must not reprint the whole board.
 */
export function newlyAccepted(
	previous: ReadonlyMap<string, string> | null,
	orders: { id: string; status: string }[]
): string[] {
	if (previous === null) return [];
	return orders.filter((o) => o.status === 'accepted' && previous.get(o.id) !== 'accepted').map((o) => o.id);
}
