import type { AppNotification, NotificationKind } from '$lib/types';
import { formatSerial, pluralize } from './format';

/** Kinds that mean "an order needs the kitchen": these ring. */
const RINGING: ReadonlySet<NotificationKind> = new Set(['new_order', 'order_waiting', 'auto_accepted']);

/** Kinds whose order reached the kitchen, so the order drawer can open it. */
const LINKED: ReadonlySet<NotificationKind> = new Set(['new_order', 'order_waiting', 'auto_accepted', 'auto_rejected']);

/**
 * Which notifications are new since the last update, and whether one of them
 * should ring. The first load only records what is there: opening the app
 * must not ring for old notifications.
 */
export function ringingArrivals(
	seen: ReadonlySet<string> | null,
	items: Pick<AppNotification, 'id' | 'kind' | 'read'>[]
): { ring: boolean; seen: Set<string> } {
	const next = new Set(seen ?? []);
	let ring = false;
	for (const item of items) {
		if (next.has(item.id)) continue;
		next.add(item.id);
		if (seen !== null && !item.read && RINGING.has(item.kind)) ring = true;
	}
	return { ring, seen: next };
}

/** One line per notification, in the app's voice. */
export function notificationText(item: AppNotification): string {
	const serial = item.serialNo === undefined ? '' : formatSerial(item.serialNo);
	switch (item.kind) {
		case 'new_order':
			return `New order ${serial} · ${pluralize(item.itemCount ?? 0, 'item')}`;
		case 'order_waiting':
			return `Order ${serial} is waiting to be accepted`;
		case 'auto_accepted':
			return `Order ${serial} accepted automatically · ${item.minutes ?? 0} min`;
		case 'auto_rejected':
			return `Order ${serial} wasn't accepted in time and was rejected`;
		case 'order_cancelled':
			// Cancelled before payment went through: it never got a number.
			return item.serialNo === undefined
				? 'A paid order was cancelled and refunded by Blinca before it reached you'
				: `Order ${serial} was cancelled and refunded by Blinca`;
		case 'stock_back':
			return `Available again: ${(item.itemNames ?? []).join(', ')}`;
	}
}

export const KIND_LABELS: Record<NotificationKind, string> = {
	new_order: 'New orders',
	order_waiting: 'Orders waiting',
	auto_accepted: 'Auto-accepted orders',
	auto_rejected: 'Missed orders',
	order_cancelled: 'Orders cancelled by Blinca',
	stock_back: 'Items available again'
};

/** The order id to open for a notification, if it has one the kitchen can see. */
export function linkedOrderId(item: Pick<AppNotification, 'kind' | 'orderId'>): string | undefined {
	return item.orderId && LINKED.has(item.kind) ? item.orderId : undefined;
}

/** Badge text: the backend caps the count, so the cap means "or more". */
export function unreadBadge(count: number, cap: number): string {
	return count >= cap ? `${cap}+` : String(count);
}
