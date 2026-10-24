/** One opening range in Stockholm wall-clock minutes. closeMinutes < openMinutes runs past midnight. */
export interface HoursRange {
	openMinutes: number;
	closeMinutes: number;
}

/** Opening hours as the backend stores them. Edited in the Blinca web portal. */
export interface OpeningHours {
	/** dayOfWeek: 0 = Monday ... 6 = Sunday. */
	weekly: (HoursRange & { dayOfWeek: number })[];
	/** Date-specific hours (yyyy-MM-dd). Empty ranges means closed that day. */
	specialDays: { date: string; ranges: HoursRange[] }[];
}

/** Whether the restaurant can take orders, as the backend decides it. */
export interface StatusInfo {
	/** Switched off by Blinca: no orders at all. */
	isActive: boolean;
	/** False while orders are paused until someone resumes. */
	isAcceptingOrders: boolean;
	/** Epoch ms. Orders are paused until then. */
	pausedUntil?: number;
	prepTimeMinutes: number;
	/** Busy mode: extra prep minutes on new orders. Read through activeBusyMinutes(). */
	busyExtraMinutes?: number;
	/** Epoch ms. Busy mode ends then; unset means until someone turns it off. */
	busyUntil?: number;
	/** Paid orders are accepted straight away with the default prep time. */
	autoAccept: boolean;
	/** Prep time the backend gives a new ASAP order right now, busy minutes included. */
	defaultPrepMinutes: number;
	hours: OpeningHours;
}

/** Pause lengths the backend accepts, in minutes. */
export const PAUSE_MINUTES = [15, 30, 60] as const;
export type PauseMinutes = (typeof PAUSE_MINUTES)[number];

/** Extra prep minutes busy mode can add (convex/lib/orderRules.ts BUSY_MINUTES). */
export const BUSY_MINUTES = [10, 20, 30] as const;
export type BusyMinutes = (typeof BUSY_MINUTES)[number];

/** How long busy mode can last, in minutes; null in the API means until turned off. */
export const BUSY_DURATIONS = [30, 60, 120] as const;
export type BusyDuration = (typeof BUSY_DURATIONS)[number];
