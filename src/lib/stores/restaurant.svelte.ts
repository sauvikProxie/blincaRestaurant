import { restaurantService, type Unsubscribe } from '$lib/services';
import type { PartnerProfile, PauseMinutes, StatusInfo } from '$lib/types';
import { restaurantState } from '$lib/utils/restaurant-status';
import { clock } from './clock.svelte';

/** Who is signed in, and whether the restaurant is taking orders right now. Both stay live. */
class RestaurantStore {
	profile = $state<PartnerProfile | null>(null);
	info = $state<StatusInfo | null>(null);
	loading = $state(true);
	error = $state<Error | null>(null);
	busy = $state(false);

	/** Re-derived as the clock ticks, so pauses and opening hours flip on time. */
	state = $derived(this.info ? restaurantState(this.info, clock.now.getTime()) : null);
	/** Sales and order history are for managers and owners. */
	canSeeReports = $derived(!!this.profile && this.profile.role !== 'employee');

	#unsubscribe: Unsubscribe[] = [];

	connect() {
		if (this.#unsubscribe.length) return;
		this.loading = true;
		this.error = null;
		const onError = (error: Error) => {
			this.error = error;
			this.loading = false;
		};
		this.#unsubscribe = [
			restaurantService.watchProfile((profile) => (this.profile = profile), onError),
			restaurantService.watchStatus((info) => {
				this.info = info;
				this.loading = false;
				this.error = null;
			}, onError)
		];
	}

	disconnect() {
		for (const unsubscribe of this.#unsubscribe) unsubscribe();
		this.#unsubscribe = [];
		this.profile = null;
		this.info = null;
		this.loading = true;
	}

	retry() {
		this.disconnect();
		this.connect();
	}

	pause(minutes: PauseMinutes | null) {
		return this.#run(() => restaurantService.pause(minutes));
	}

	resume() {
		return this.#run(() => restaurantService.resume());
	}

	async #run(work: () => Promise<void>) {
		this.busy = true;
		try {
			await work();
			clock.now = new Date();
		} finally {
			this.busy = false;
		}
	}
}

export const restaurant = new RestaurantStore();
