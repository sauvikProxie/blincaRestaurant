import type { LucideIcon } from '@lucide/svelte';
import ChartColumn from '@lucide/svelte/icons/chart-column';
import Gauge from '@lucide/svelte/icons/gauge';
import House from '@lucide/svelte/icons/house';
import Receipt from '@lucide/svelte/icons/receipt';

export interface NavItem {
	href: string;
	label: string;
	icon: LucideIcon;
	/** Backed by manager-level reports on the backend: hidden for employees. */
	managersOnly?: boolean;
}

/** Menu, hours and discounts are managed in the Blinca web portal, not here. */
export const NAV_ITEMS: NavItem[] = [
	{ href: '/', label: 'Home', icon: House },
	{ href: '/orders', label: 'Previous Orders', icon: Receipt, managersOnly: true },
	{ href: '/sales', label: 'Sales', icon: ChartColumn, managersOnly: true },
	{ href: '/performance', label: 'Performance', icon: Gauge, managersOnly: true }
];

export function isActive(href: string, pathname: string): boolean {
	return href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`);
}
