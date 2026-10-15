export const ORDER_STATUSES = [
	'pending',
	'accepted',
	'preparing',
	'ready_for_pickup',
	'out_for_delivery',
	'delivered',
	'cancelled'
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

/** Statuses for orders still in progress, in lifecycle order. */
export const ACTIVE_STATUSES: readonly OrderStatus[] = [
	'pending',
	'accepted',
	'preparing',
	'ready_for_pickup',
	'out_for_delivery'
];

export const PAST_STATUSES: readonly OrderStatus[] = ['delivered', 'cancelled'];

export interface Customer {
	name: string;
	phone: string;
	address: string;
}

export interface OrderItem {
	productId: string;
	name: string;
	quantity: number;
	/** Minor units (ore). */
	unitPrice: number;
	notes?: string;
}

/** All amounts are integers in minor units (ore). */
export interface Order {
	id: string;
	/** Shown as "#1024". */
	serialNo: number;
	/** ISO timestamp. */
	placedAt: string;
	customer: Customer;
	items: OrderItem[];
	status: OrderStatus;
	subtotal: number;
	discount: number;
	/** Name of the applied offer, when there is one. */
	discountLabel?: string;
	vat: number;
	deliveryFee: number;
	total: number;
	/** 1-5, only once the customer has rated. */
	rating?: number;
	/** ISO timestamp. */
	deliveredAt?: string;
	isDelayed: boolean;
}

export type SortDirection = 'asc' | 'desc';

export interface PastOrdersQuery {
	search?: string;
	status?: 'delivered' | 'cancelled';
	/** Inclusive, yyyy-MM-dd. */
	from?: string;
	/** Inclusive, yyyy-MM-dd. */
	to?: string;
	sortBy: 'placedAt' | 'total';
	sortDir: SortDirection;
	page: number;
	pageSize: number;
}

export interface Page<T> {
	items: T[];
	total: number;
	page: number;
	pageSize: number;
}
