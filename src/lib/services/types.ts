import type {
	Credentials,
	Discount,
	DiscountInput,
	Guide,
	Order,
	OrderStatus,
	Page,
	PastOrdersQuery,
	Product,
	Schedule,
	Session,
	StatusOverride
} from '$lib/types';
import type { MonthlyMetrics } from '$lib/utils/performance';

/**
 * Service contracts used by the UI. The mock implementations in ./mock can be
 * replaced with API-backed ones in ./index.ts without touching any component.
 */

export interface AuthService {
	/** Rejects with InvalidCredentialsError when the phone number and password don't match. */
	signIn(credentials: Credentials): Promise<Session>;
	signOut(): Promise<void>;
}

export type OrderEvent = { type: 'created' | 'updated'; order: Order };

export interface OrdersService {
	/** Orders still in progress, newest first. */
	listActive(): Promise<Order[]>;
	/** Delivered and cancelled orders, filtered, sorted and paged. */
	listPast(query: PastOrdersQuery): Promise<Page<Order>>;
	getById(id: string): Promise<Order | null>;
	updateStatus(id: string, status: OrderStatus): Promise<Order>;
	/** Live order changes (a websocket in production). Returns an unsubscribe function. */
	subscribe(listener: (event: OrderEvent) => void): () => void;
}

export interface MenuService {
	list(): Promise<Product[]>;
	setAvailability(id: string, isAvailable: boolean): Promise<Product>;
}

export interface ScheduleService {
	get(): Promise<Schedule>;
	save(schedule: Schedule): Promise<Schedule>;
}

export interface StatusService {
	/** Every manual override, oldest first. The last one may still be in force. */
	listOverrides(): Promise<StatusOverride[]>;
	startOverride(override: StatusOverride): Promise<void>;
	endOverride(id: string, endedAt: string): Promise<void>;
}

export interface DiscountsService {
	list(): Promise<Discount[]>;
	create(input: DiscountInput): Promise<Discount>;
	update(id: string, input: DiscountInput): Promise<Discount>;
	remove(id: string): Promise<void>;
}

export interface MonthlyReport {
	current: MonthlyMetrics;
	previous: MonthlyMetrics;
	/** Set when the month is still running: the previous month only counts up to this date. */
	previousUntil: Date | null;
}

export interface PerformanceService {
	getMonthlyReport(month: Date): Promise<MonthlyReport>;
}

export interface GuidesService {
	list(): Promise<Guide[]>;
}
