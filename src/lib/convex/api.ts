/**
 * Typed references to the Blinca Convex functions this app calls.
 *
 * This app lives outside the backend monorepo, so it can't import the
 * generated `api` object. Each reference below mirrors a function in
 * `Blinca backend/packages/backend/convex/` (file:function) with the same
 * argument and return shapes. If the backend changes one of them, update it
 * here too. Moving the app into the monorepo would let it use
 * `@blinca/backend/convex/_generated/api` instead.
 */
import { makeFunctionReference } from 'convex/server';

/** Convex document ids travel as strings. */
export type Id = string;

type NoArgs = Record<string, never>;

const query = <Args extends Record<string, unknown>, Return>(name: string) =>
	makeFunctionReference<'query', Args, Return>(name);
const mutation = <Args extends Record<string, unknown>, Return>(name: string) =>
	makeFunctionReference<'mutation', Args, Return>(name);

// ---- Shared shapes (convex/lib/orderRules.ts, lib/orderValidators.ts) ----

export type BackendOrderStatus =
	| 'awaiting_payment'
	| 'new'
	| 'accepted'
	| 'ready'
	| 'picked_up'
	| 'rejected'
	| 'cancelled';
export type BackendFulfillment = 'delivery' | 'pickup';
export type BackendRejectReason =
	| 'too_busy'
	| 'item_unavailable'
	| 'closing_soon'
	| 'technical_issue'
	| 'other'
	| 'not_accepted_in_time';
export type BackendRefundStatus = 'requested' | 'processing' | 'succeeded' | 'failed';
export type StockTarget = { kind: 'item' | 'variant' | 'option'; id: Id };

export type HoursRange = { openMinutes: number; closeMinutes: number };
export type OpeningHours = {
	weekly: (HoursRange & { dayOfWeek: number })[];
	specialDays: { date: string; ranges: HoursRange[] }[];
};

// ---- partnerProfiles.ts ----

export type PartnerRole = 'employee' | 'manager' | 'owner';
export type PartnerMe = {
	name: string;
	email: string;
	role: PartnerRole;
	restaurantId: Id;
	restaurantName: string;
};

// ---- orders.ts ----

export type BoardCard = {
	_id: Id;
	dailyNumber: number;
	status: 'new' | 'accepted' | 'ready';
	fulfillment: BackendFulfillment;
	customerFirstName: string;
	itemCount: number;
	totalCents: number;
	paidAt: number;
	acceptDeadline?: number;
	estimatedReadyAt?: number;
	readyAt?: number;
	scheduledFor?: number;
};

export type OrderDoc = {
	_id: Id;
	_creationTime: number;
	dailyNumber?: number;
	customerName: string;
	customerPhone?: string;
	fulfillment: BackendFulfillment;
	deliveryAddress?: { street: string; postalCode: string; city: string; doorCode?: string; floor?: string };
	scheduledFor?: number;
	customerNote?: string;
	subtotalCents: number;
	deliveryFeeCents: number;
	discountCents: number;
	totalCents: number;
	vatBreakdown: { basisPoints: number; vatCents: number }[];
	status: BackendOrderStatus;
	paidAt?: number;
	acceptDeadline?: number;
	prepMinutes?: number;
	acceptedAt?: number;
	estimatedReadyAt?: number;
	readyAt?: number;
	pickedUpAt?: number;
	rejectedAt?: number;
	rejectReason?: BackendRejectReason;
	rejectNote?: string;
	cancelledAt?: number;
	cancelReason?: string;
	/** True when the backend accepted it on its own (restaurant auto-accept). */
	autoAccepted?: boolean;
	placedAt: number;
};

export type OrderItemDoc = {
	_id: Id;
	menuItemId?: Id;
	variantId?: Id;
	name: string;
	variantName?: string;
	unitPriceCents: number;
	quantity: number;
	note?: string;
	lineTotalCents: number;
	options: {
		_id: Id;
		optionId?: Id;
		groupName: string;
		optionName: string;
		priceCents: number;
		quantity: number;
	}[];
};

export type OrderGetResult = {
	order: OrderDoc;
	items: OrderItemDoc[];
	refund: { status: BackendRefundStatus; amountCents: number } | null;
};

// ---- restaurants.ts ----

export type OrderStatusResult = {
	isActive: boolean;
	isAcceptingOrders: boolean;
	pausedUntil?: number;
	prepTimeMinutes: number;
	busyExtraMinutes?: number;
	busyUntil?: number;
	autoAccept: boolean;
	/** Prep time for a new ASAP order right now, busy minutes included. */
	defaultPrepMinutes: number;
	hours: OpeningHours;
};

// ---- orders.ts: ticket ----

export type KitchenTicketResult = {
	restaurantName: string;
	dailyNumber: number;
	fulfillment: BackendFulfillment;
	paidAt: number;
	scheduledFor?: number;
	customerFirstName: string;
	customerNote?: string;
	deliveryAddress?: { street: string; postalCode: string; city: string; doorCode?: string; floor?: string };
	items: {
		quantity: number;
		name: string;
		variantName?: string;
		note?: string;
		options: { name: string; quantity: number }[];
	}[];
	totalCents: number;
};

// ---- partnerNotifications.ts (lib/notifications.ts) ----

export type NotificationKind =
	| 'new_order'
	| 'order_waiting'
	| 'auto_accepted'
	| 'auto_rejected'
	| 'order_cancelled'
	| 'stock_back';
export type Tone = 'chime' | 'bell' | 'beep';
export type SoundSettings = { enabled: boolean; tone: Tone; volume: number; repeatUntilAccepted: boolean };

export type FeedResult = {
	items: {
		_id: Id;
		kind: NotificationKind;
		orderId?: Id;
		data: {
			dailyNumber?: number;
			itemCount?: number;
			totalCents?: number;
			minutes?: number;
			reason?: string;
			itemNames?: string[];
		};
		createdAt: number;
		read: boolean;
	}[];
	/** Capped by the backend at MAX_UNREAD_COUNT (99). */
	unreadCount: number;
	settings: { sound: SoundSettings; mutedKinds: NotificationKind[] };
};

// ---- orderReports.ts ----

export type HistoryRow = {
	_id: Id;
	dailyNumber: number;
	placedAt: number;
	status: BackendOrderStatus;
	fulfillment: BackendFulfillment;
	customerName: string;
	totalCents: number;
	refundStatus: BackendRefundStatus | null;
};

export type HistoryArgs = {
	fromDate: string;
	toDate: string;
	status?: 'picked_up' | 'rejected' | 'cancelled';
	search?: string;
	paginationOpts: { numItems: number; cursor: string | null };
};

export type HistoryPage = { page: HistoryRow[]; isDone: boolean; continueCursor: string };

export type SalesSummaryResult = {
	orderCount: number;
	completedCount: number;
	rejectedCount: number;
	revenueCents: number;
	averageOrderCents: number;
	rejectionRate: number;
	averagePrepMinutes: number | null;
	daily: { date: string; orders: number; revenueCents: number }[];
	topProducts: { name: string; quantity: number; revenueCents: number }[];
	/** True when the range held more orders than the backend reads at once. */
	truncated: boolean;
	coveredFrom: string | null;
};

/** orderReports.ts:performance (maths in lib/performance.ts). */
export type PerformanceResult = {
	paidOrders: number;
	acceptedOrders: number;
	acceptanceRate: number | null;
	rejectedByReason: { reason: string; count: number }[];
	autoRejected: number;
	autoAccepted: number;
	acceptSeconds: { median: number | null; average: number | null };
	cancelledAfterAccept: number;
	cancelledByReason: { reason: string; count: number }[];
	refundedCents: number;
	lateShare: number | null;
	averageMinutesLate: number | null;
	promisedPrepMinutes: number | null;
	actualPrepMinutes: number | null;
	openMinutes: number;
	pausedMinutes: number;
	busyMinutes: number;
	soldOutItems: number;
	soldOutOptions: number;
	truncated: boolean;
	coveredFrom: string | null;
};

export const api = {
	partnerProfiles: {
		me: query<NoArgs, PartnerMe>('partnerProfiles:me')
	},
	orders: {
		board: query<NoArgs, BoardCard[]>('orders:board'),
		get: query<{ orderId: Id }, OrderGetResult>('orders:get'),
		accept: mutation<{ orderId: Id; prepMinutes?: number }, null>('orders:accept'),
		reject: mutation<
			{ orderId: Id; reason: Exclude<BackendRejectReason, 'not_accepted_in_time'>; note?: string; unavailable?: StockTarget[] },
			null
		>('orders:reject'),
		delay: mutation<{ orderId: Id; minutes: number }, null>('orders:delay'),
		markReady: mutation<{ orderId: Id }, null>('orders:markReady'),
		handOver: mutation<{ orderId: Id }, null>('orders:handOver'),
		ticket: query<{ orderId: Id }, KitchenTicketResult>('orders:ticket')
	},
	restaurants: {
		orderStatus: query<NoArgs, OrderStatusResult>('restaurants:orderStatus'),
		pauseOrders: mutation<{ minutes: number | null }, null>('restaurants:pauseOrders'),
		resumeOrders: mutation<NoArgs, null>('restaurants:resumeOrders'),
		setBusy: mutation<{ extraMinutes: number; durationMinutes: number | null }, null>('restaurants:setBusy'),
		clearBusy: mutation<NoArgs, null>('restaurants:clearBusy'),
		setAutoAccept: mutation<{ enabled: boolean }, null>('restaurants:setAutoAccept')
	},
	partnerNotifications: {
		feed: query<{ limit?: number }, FeedResult>('partnerNotifications:feed'),
		markRead: mutation<{ notificationId: Id }, null>('partnerNotifications:markRead'),
		markAllRead: mutation<NoArgs, null>('partnerNotifications:markAllRead'),
		updateSettings: mutation<{ sound?: SoundSettings; mutedKinds?: NotificationKind[] }, null>(
			'partnerNotifications:updateSettings'
		)
	},
	orderReports: {
		history: query<HistoryArgs, HistoryPage>('orderReports:history'),
		salesSummary: query<{ fromDate: string; toDate: string }, SalesSummaryResult>('orderReports:salesSummary'),
		performance: query<{ fromDate: string; toDate: string }, PerformanceResult>('orderReports:performance')
	},
	devOrders: {
		simulateForMe: mutation<{ fulfillment?: BackendFulfillment; scheduled?: boolean }, unknown>(
			'devOrders:simulateForMe'
		)
	}
};
