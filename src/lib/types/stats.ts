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
