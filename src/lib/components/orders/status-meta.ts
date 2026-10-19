import type { LucideIcon } from '@lucide/svelte';
import Ban from '@lucide/svelte/icons/ban';
import Bell from '@lucide/svelte/icons/bell';
import Bike from '@lucide/svelte/icons/bike';
import ChefHat from '@lucide/svelte/icons/chef-hat';
import CircleCheckBig from '@lucide/svelte/icons/circle-check-big';
import CircleX from '@lucide/svelte/icons/circle-x';
import PackageCheck from '@lucide/svelte/icons/package-check';
import ShoppingBag from '@lucide/svelte/icons/shopping-bag';
import type { AnyRejectReason, Fulfillment, OrderStatus, OrderSummary, RefundStatus } from '$lib/types';
import type { BadgeTone } from '$lib/components/ui/Badge.svelte';
import { formatDateTime, formatTime } from '$lib/utils/format';

export interface StatusMeta {
	label: string;
	tone: BadgeTone;
	icon: LucideIcon;
}

/**
 * Each status gets a distinct fill style and icon inside the brand palette,
 * so status never relies on colour alone.
 */
export const STATUS_META: Record<OrderStatus, StatusMeta> = {
	new: { label: 'New', tone: 'action', icon: Bell },
	accepted: { label: 'Preparing', tone: 'tint', icon: ChefHat },
	ready: { label: 'Ready', tone: 'dark', icon: PackageCheck },
	picked_up: { label: 'Handed over', tone: 'muted', icon: CircleCheckBig },
	rejected: { label: 'Rejected', tone: 'muted-outline', icon: CircleX },
	cancelled: { label: 'Cancelled', tone: 'muted-outline', icon: Ban }
};

export const FULFILLMENT_META: Record<Fulfillment, { label: string; icon: LucideIcon }> = {
	delivery: { label: 'Delivery', icon: Bike },
	pickup: { label: 'Pickup', icon: ShoppingBag }
};

export const REJECT_REASON_LABELS: Record<AnyRejectReason, string> = {
	too_busy: 'Too busy',
	item_unavailable: 'Item unavailable',
	closing_soon: 'Closing soon',
	technical_issue: 'Technical problem',
	other: 'Other reason',
	not_accepted_in_time: 'Not accepted in time'
};

export const REFUND_LABELS: Record<RefundStatus, string> = {
	requested: 'Refund requested',
	processing: 'Refund in progress',
	succeeded: 'Refunded',
	failed: 'Refund failed'
};

/** Shown in the drawer footer once there is nothing left for the kitchen to do. */
export const STATUS_HINTS: Partial<Record<OrderStatus, string>> = {
	picked_up: 'This order has left the kitchen.',
	rejected: 'This order was rejected and the customer is being refunded.',
	cancelled: 'This order was cancelled and the customer is being refunded.'
};

/** "4 min", "Under a minute", or null once the moment has passed. */
export function timeLeft(until: number, now: number): string | null {
	const ms = until - now;
	if (ms <= 0) return null;
	const minutes = Math.floor(ms / 60_000);
	return minutes < 1 ? 'under a minute' : `${minutes} min`;
}

/** The one timing fact the kitchen needs for an active order. */
export function timingNote(order: OrderSummary, now: number): string {
	if (order.status === 'new') {
		if (order.scheduledFor) return `Pre-order for ${formatDateTime(order.scheduledFor)}`;
		const left = order.acceptDeadline ? timeLeft(order.acceptDeadline, now) : null;
		return left ? `Accept within ${left}` : 'Accept now';
	}
	if (order.status === 'accepted' && order.estimatedReadyAt) {
		return order.estimatedReadyAt < now
			? `Was due ${formatTime(order.estimatedReadyAt)}`
			: `Ready by ${formatTime(order.estimatedReadyAt)}`;
	}
	if (order.status === 'ready' && order.readyAt) return `Ready since ${formatTime(order.readyAt)}`;
	return '';
}

/** True when the kitchen is behind: the accept window is nearly gone, or the ready time has passed. */
export function isUrgent(order: OrderSummary, now: number): boolean {
	if (order.status === 'new' && !order.scheduledFor && order.acceptDeadline) {
		return order.acceptDeadline - now < 2 * 60_000;
	}
	return order.status === 'accepted' && !!order.estimatedReadyAt && order.estimatedReadyAt < now;
}
