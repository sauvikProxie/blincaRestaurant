import type { LucideIcon } from '@lucide/svelte';
import Bell from '@lucide/svelte/icons/bell';
import Bike from '@lucide/svelte/icons/bike';
import ChefHat from '@lucide/svelte/icons/chef-hat';
import CircleCheck from '@lucide/svelte/icons/circle-check';
import CircleCheckBig from '@lucide/svelte/icons/circle-check-big';
import CircleX from '@lucide/svelte/icons/circle-x';
import PackageCheck from '@lucide/svelte/icons/package-check';
import type { OrderStatus } from '$lib/types';
import type { BadgeTone } from '$lib/components/ui/Badge.svelte';

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
	pending: { label: 'Pending', tone: 'action', icon: Bell },
	accepted: { label: 'Accepted', tone: 'action-outline', icon: CircleCheck },
	preparing: { label: 'Preparing', tone: 'tint', icon: ChefHat },
	ready_for_pickup: { label: 'Ready for pickup', tone: 'dark', icon: PackageCheck },
	out_for_delivery: { label: 'Out for delivery', tone: 'dark-outline', icon: Bike },
	delivered: { label: 'Delivered', tone: 'muted', icon: CircleCheckBig },
	cancelled: { label: 'Cancelled', tone: 'muted-outline', icon: CircleX }
};

export interface OrderAction {
	label: string;
	to: OrderStatus;
	variant: 'primary' | 'secondary';
	/** Ask before doing it. */
	confirm?: { title: string; body: string; confirmLabel: string };
}

/** What the kitchen can do next for an order in each status. */
export const NEXT_ACTIONS: Partial<Record<OrderStatus, OrderAction[]>> = {
	pending: [
		{
			label: 'Reject',
			to: 'cancelled',
			variant: 'secondary',
			confirm: {
				title: 'Reject this order?',
				body: "We'll let the customer know and refund them straight away. This can't be undone.",
				confirmLabel: 'Reject order'
			}
		},
		{ label: 'Accept', to: 'accepted', variant: 'primary' }
	],
	accepted: [{ label: 'Mark preparing', to: 'preparing', variant: 'primary' }],
	preparing: [{ label: 'Mark ready', to: 'ready_for_pickup', variant: 'primary' }]
};

/** Shown instead of buttons while the order is with the rider. */
export const STATUS_HINTS: Partial<Record<OrderStatus, string>> = {
	ready_for_pickup: 'Ready and waiting. The rider is on the way to collect it.',
	out_for_delivery: "With the rider and on the way to the customer. Nothing more to do here."
};
