/**
 * Orders as the backend runs them: paid orders arrive as `new`, the kitchen
 * accepts (with a prep time) or rejects, marks them ready, then hands them
 * over to the rider or the customer collecting.
 */
export const ORDER_STATUSES = ['new', 'accepted', 'ready', 'picked_up', 'rejected', 'cancelled'] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

/** Statuses for orders still in the kitchen, in lifecycle order. */
export const ACTIVE_STATUSES: readonly OrderStatus[] = ['new', 'accepted', 'ready'];

export const PAST_STATUSES: readonly OrderStatus[] = ['picked_up', 'rejected', 'cancelled'];

export type Fulfillment = 'delivery' | 'pickup';

/** Prep times the backend accepts, in minutes. */
export const PREP_MINUTES = [10, 15, 20, 30, 45, 60] as const;
/** Extra minutes the kitchen can add to an accepted order. */
export const DELAY_MINUTES = [5, 10, 15] as const;

export const REJECT_REASONS = ['too_busy', 'item_unavailable', 'closing_soon', 'technical_issue', 'other'] as const;
export type RejectReason = (typeof REJECT_REASONS)[number];
/** Reasons that can appear on an order, including the automatic one. */
export type AnyRejectReason = RejectReason | 'not_accepted_in_time';

export type RefundStatus = 'requested' | 'processing' | 'succeeded' | 'failed';

/** Something the kitchen can mark sold out when rejecting for missing items. */
export interface StockTarget {
	kind: 'item' | 'variant' | 'option';
	id: string;
}

/** One row in an order list. Times are epoch milliseconds; amounts are öre, VAT included. */
export interface OrderSummary {
	id: string;
	/** Resets every business day. Shown as "#12". */
	serialNo: number;
	status: OrderStatus;
	fulfillment: Fulfillment;
	customerName: string;
	/** Undefined in history rows, which carry no items. */
	itemCount?: number;
	total: number;
	/** When the order was paid, which is when it reached the kitchen. */
	placedAt: number;
	/** New orders are rejected automatically after this. */
	acceptDeadline?: number;
	estimatedReadyAt?: number;
	readyAt?: number;
	/** Set for pre-orders: the slot the customer chose. */
	scheduledFor?: number;
	refundStatus?: RefundStatus | null;
}

export interface OrderLineOption {
	group: string;
	name: string;
	quantity: number;
	/** Price per unit, öre. */
	price: number;
	optionId?: string;
}

export interface OrderLine {
	id: string;
	name: string;
	variantName?: string;
	quantity: number;
	unitPrice: number;
	total: number;
	note?: string;
	options: OrderLineOption[];
	menuItemId?: string;
	variantId?: string;
}

export interface OrderDetail extends OrderSummary {
	itemCount: number;
	customer: {
		name: string;
		phone?: string;
		/** One line, e.g. "Götgatan 45, 11826 Stockholm". */
		address?: string;
		/** Door code and floor, when given. */
		addressNote?: string;
	};
	note?: string;
	lines: OrderLine[];
	subtotal: number;
	discount: number;
	deliveryFee: number;
	/** VAT contained in the total, per rate. `rate` is a fraction, e.g. 0.12. */
	vat: { rate: number; amount: number }[];
	prepMinutes?: number;
	acceptedAt?: number;
	pickedUpAt?: number;
	rejectedAt?: number;
	rejectReason?: AnyRejectReason;
	rejectNote?: string;
	cancelledAt?: number;
	cancelReason?: string;
}

export interface RejectInput {
	reason: RejectReason;
	/** Required for "other". */
	note?: string;
	/** Required for "item_unavailable": these are marked sold out for today. */
	unavailable?: StockTarget[];
}

export interface HistoryQuery {
	/** Inclusive business dates, yyyy-MM-dd. The backend allows at most 92 days. */
	from: string;
	to: string;
	status?: 'picked_up' | 'rejected' | 'cancelled';
	/** Customer name or order number. */
	search?: string;
}

export interface HistoryPage {
	orders: OrderSummary[];
	/** Pass back to load the next page. */
	cursor: string;
	isDone: boolean;
}
