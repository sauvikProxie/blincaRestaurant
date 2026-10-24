import type {
	BusyDuration,
	BusyMinutes,
	Credentials,
	HistoryPage,
	HistoryQuery,
	KitchenTicket,
	NotificationFeed,
	NotificationKind,
	OrderDetail,
	OrderSummary,
	PartnerProfile,
	PauseMinutes,
	PerformanceReport,
	RejectInput,
	SalesSummary,
	Session,
	SoundSettings,
	StatusInfo
} from '$lib/types';

/**
 * Service contracts used by the UI. The Convex implementations live in
 * ./convex; components and stores only ever see these interfaces.
 */

export type Unsubscribe = () => void;

/** Live data: `onChange` runs with the first result and again whenever it changes on the server. */
export type Watch<T> = (onChange: (value: T) => void, onError: (error: Error) => void) => Unsubscribe;

export interface AuthService {
	/**
	 * Signs in and checks the account belongs to a restaurant. Rejects with
	 * InvalidCredentialsError, NoRestaurantAccessError or TooManyAttemptsError.
	 */
	signIn(credentials: Credentials): Promise<Session>;
	/** Uses this session for every backend call. `onExpired` runs if the backend ends it. */
	connect(session: Session, onExpired: () => void): void;
	/** Ends the session on the backend and stops using it. */
	signOut(session: Session): Promise<void>;
}

export interface OrdersService {
	/** Orders in the kitchen (new, accepted, ready), most urgent first. */
	watchBoard: Watch<OrderSummary[]>;
	/** One order with its lines and amounts; null when it doesn't exist. */
	watchOrder(id: string, onChange: (order: OrderDetail | null) => void, onError: (error: Error) => void): Unsubscribe;
	/** `prepMinutes` is required unless the order is a pre-order. */
	accept(id: string, prepMinutes?: number): Promise<void>;
	reject(id: string, input: RejectInput): Promise<void>;
	delay(id: string, minutes: number): Promise<void>;
	markReady(id: string): Promise<void>;
	/** Given to the rider, or collected by the customer. */
	handOver(id: string): Promise<void>;
	/** The printable kitchen ticket for one order. */
	ticket(id: string): Promise<KitchenTicket>;
	/** Finished orders, newest first. Pass the previous page's cursor to continue. */
	history(query: HistoryQuery, cursor: string | null, pageSize: number): Promise<HistoryPage>;
	/** Dev deployments only: places a paid test order for this restaurant. */
	simulate(): Promise<void>;
}

export interface RestaurantService {
	watchProfile: Watch<PartnerProfile>;
	watchStatus: Watch<StatusInfo>;
	/** Stops new orders for a while, or until resumed when `minutes` is null. */
	pause(minutes: PauseMinutes | null): Promise<void>;
	resume(): Promise<void>;
	/** Adds prep minutes to new orders for a while, or until turned off when `durationMinutes` is null. */
	setBusy(extraMinutes: BusyMinutes, durationMinutes: BusyDuration | null): Promise<void>;
	clearBusy(): Promise<void>;
	/** Managers and owners only. */
	setAutoAccept(enabled: boolean): Promise<void>;
}

export interface NotificationsService {
	/** Newest first, with the unread count and this login's settings. */
	watchFeed: Watch<NotificationFeed>;
	markRead(id: string): Promise<void>;
	markAllRead(): Promise<void>;
	updateSettings(settings: { sound?: SoundSettings; mutedKinds?: NotificationKind[] }): Promise<void>;
}

export interface StatsService {
	/** Inclusive business dates (yyyy-MM-dd). Managers and owners only. */
	salesSummary(from: string, to: string): Promise<SalesSummary>;
	/** Inclusive business dates (yyyy-MM-dd). Managers and owners only. */
	performance(from: string, to: string): Promise<PerformanceReport>;
}
