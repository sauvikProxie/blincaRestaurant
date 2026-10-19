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
	hours: OpeningHours;
}

/** Pause lengths the backend accepts, in minutes. */
export const PAUSE_MINUTES = [15, 30, 60] as const;
export type PauseMinutes = (typeof PAUSE_MINUTES)[number];
