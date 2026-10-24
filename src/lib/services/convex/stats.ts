import { api } from '$lib/convex/api';
import { convex } from '$lib/convex/client';
import type { StatsService } from '../types';

export function createConvexStatsService(): StatsService {
	return {
		async salesSummary(from, to) {
			const s = await convex().query(api.orderReports.salesSummary, { fromDate: from, toDate: to });
			return {
				orderCount: s.orderCount,
				completedCount: s.completedCount,
				rejectedCount: s.rejectedCount,
				revenue: s.revenueCents,
				averageOrder: s.averageOrderCents,
				rejectionRate: s.rejectionRate,
				averagePrepMinutes: s.averagePrepMinutes,
				daily: s.daily.map((day) => ({ date: day.date, orders: day.orders, revenue: day.revenueCents })),
				topProducts: s.topProducts.map((p) => ({ name: p.name, quantity: p.quantity, revenue: p.revenueCents })),
				coveredFrom: s.truncated ? s.coveredFrom : null
			};
		},

		async performance(from, to) {
			const { refundedCents, truncated, coveredFrom, ...rest } = await convex().query(api.orderReports.performance, {
				fromDate: from,
				toDate: to
			});
			return { ...rest, refunded: refundedCents, coveredFrom: truncated ? coveredFrom : null };
		}
	};
}
