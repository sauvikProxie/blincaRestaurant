import type { LucideIcon } from '@lucide/svelte';
import CalendarClock from '@lucide/svelte/icons/calendar-clock';
import ChartColumn from '@lucide/svelte/icons/chart-column';
import House from '@lucide/svelte/icons/house';
import Receipt from '@lucide/svelte/icons/receipt';
import Sparkles from '@lucide/svelte/icons/sparkles';
import TicketPercent from '@lucide/svelte/icons/ticket-percent';
import UtensilsCrossed from '@lucide/svelte/icons/utensils-crossed';

export interface NavItem {
	href: string;
	label: string;
	icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
	{ href: '/', label: 'Home', icon: House },
	{ href: '/schedule', label: 'Scheduled Hours', icon: CalendarClock },
	{ href: '/orders', label: 'Previous Orders', icon: Receipt },
	{ href: '/performance', label: 'Team Performance', icon: ChartColumn },
	{ href: '/menu', label: 'Menu', icon: UtensilsCrossed },
	{ href: '/discounts', label: 'Discounts', icon: TicketPercent },
	{ href: '/whats-new', label: "What's New", icon: Sparkles }
];

export function isActive(href: string, pathname: string): boolean {
	return href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`);
}
