import { api, type FeedResult } from '$lib/convex/api';
import { convex } from '$lib/convex/client';
import type { NotificationFeed } from '$lib/types';
import type { NotificationsService } from '../types';

/** Enough to fill the panel; the backend caps it at 50. */
const FEED_LIMIT = 30;

function toFeed(result: FeedResult): NotificationFeed {
	return {
		items: result.items.map((item) => ({
			id: item._id,
			kind: item.kind,
			orderId: item.orderId,
			serialNo: item.data.dailyNumber,
			itemCount: item.data.itemCount,
			minutes: item.data.minutes,
			itemNames: item.data.itemNames,
			createdAt: item.createdAt,
			read: item.read
		})),
		unreadCount: result.unreadCount,
		settings: result.settings
	};
}

export function createConvexNotificationsService(): NotificationsService {
	return {
		watchFeed(onChange, onError) {
			return convex().onUpdate(api.partnerNotifications.feed, { limit: FEED_LIMIT }, (r) => onChange(toFeed(r)), onError);
		},

		async markRead(id) {
			await convex().mutation(api.partnerNotifications.markRead, { notificationId: id });
		},

		async markAllRead() {
			await convex().mutation(api.partnerNotifications.markAllRead, {});
		},

		async updateSettings(settings) {
			await convex().mutation(api.partnerNotifications.updateSettings, settings);
		}
	};
}
