/** Kinds of in-app notification the backend writes (convex/lib/notifications.ts). */
export const NOTIFICATION_KINDS = [
	'new_order',
	'order_waiting',
	'auto_accepted',
	'auto_rejected',
	'order_cancelled',
	'stock_back'
] as const;
export type NotificationKind = (typeof NOTIFICATION_KINDS)[number];

/** The backend refuses to mute these: a kitchen must always hear about an order to take. */
export const REQUIRED_KINDS: readonly NotificationKind[] = ['new_order', 'order_waiting', 'auto_accepted'];

export const TONES = ['chime', 'bell', 'beep'] as const;
export type Tone = (typeof TONES)[number];

/** Per login, saved on the backend so it follows the staff member to any device. */
export interface SoundSettings {
	enabled: boolean;
	tone: Tone;
	/** 0-100 */
	volume: number;
	/** Keep ringing every few seconds while an order waits to be accepted. */
	repeatUntilAccepted: boolean;
}

export interface NotificationSettings {
	sound: SoundSettings;
	mutedKinds: NotificationKind[];
}

/** One notification. Never carries a customer's name, phone or address. */
export interface AppNotification {
	id: string;
	kind: NotificationKind;
	orderId?: string;
	serialNo?: number;
	itemCount?: number;
	minutes?: number;
	itemNames?: string[];
	createdAt: number;
	read: boolean;
}

export interface NotificationFeed {
	items: AppNotification[];
	/** Capped by the backend; at the cap it means "this many or more". */
	unreadCount: number;
	settings: NotificationSettings;
}

/** The backend's unread cap (MAX_UNREAD_COUNT). */
export const MAX_UNREAD_COUNT = 99;
