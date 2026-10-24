/** Sales for a range of business days. Amounts are öre, VAT included. */
export interface SalesSummary {
	/** Every paid order in the range, rejected ones included. */
	orderCount: number;
	completedCount: number;
	rejectedCount: number;
	revenue: number;
	averageOrder: number;
	/** 0-1 */
	rejectionRate: number;
	averagePrepMinutes: number | null;
	daily: { date: string; orders: number; revenue: number }[];
	topProducts: { name: string; quantity: number; revenue: number }[];
	/** Set when the range had more orders than the backend reads at once: totals start at this date. */
	coveredFrom: string | null;
}

/** How reliably the kitchen took and finished orders over a range of business days. */
export interface PerformanceReport {
	/** Paid orders that reached the kitchen. */
	paidOrders: number;
	acceptedOrders: number;
	/** 0-1, null without orders. */
	acceptanceRate: number | null;
	/** Rejected by staff, by reason code. Missed orders are counted in `autoRejected`. */
	rejectedByReason: { reason: string; count: number }[];
	/** Not accepted in time, so the backend rejected them. */
	autoRejected: number;
	autoAccepted: number;
	/** Seconds from payment to a person accepting (auto-accepted orders left out). */
	acceptSeconds: { median: number | null; average: number | null };
	cancelledAfterAccept: number;
	cancelledByReason: { reason: string; count: number }[];
	/** öre */
	refunded: number;
	/** Share of ASAP orders ready more than 2 minutes after the promised time. 0-1. */
	lateShare: number | null;
	averageMinutesLate: number | null;
	promisedPrepMinutes: number | null;
	actualPrepMinutes: number | null;
	openMinutes: number;
	/** Minutes paused or busy while the opening hours said open. */
	pausedMinutes: number;
	busyMinutes: number;
	/** Sold out right now, not over the range. */
	soldOutItems: number;
	soldOutOptions: number;
	/** Set when the range held more orders than the backend reads at once: order figures start at this date. */
	coveredFrom: string | null;
}
