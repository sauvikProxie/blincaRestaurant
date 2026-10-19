import { api } from '$lib/convex/api';
import { convex } from '$lib/convex/client';
import type { RestaurantService } from '../types';

export function createConvexRestaurantService(): RestaurantService {
	return {
		watchProfile(onChange, onError) {
			return convex().onUpdate(
				api.partnerProfiles.me,
				{},
				({ name, email, role, restaurantName }) => onChange({ name, email, role, restaurantName }),
				onError
			);
		},

		watchStatus(onChange, onError) {
			return convex().onUpdate(api.restaurants.orderStatus, {}, onChange, onError);
		},

		async pause(minutes) {
			await convex().mutation(api.restaurants.pauseOrders, { minutes });
		},

		async resume() {
			await convex().mutation(api.restaurants.resumeOrders, {});
		}
	};
}
