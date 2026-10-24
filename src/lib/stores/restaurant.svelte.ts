import { restaurantService, type Unsubscribe } from '$lib/services';
import type { BusyDuration, BusyMinutes, PartnerProfile, PauseMinutes, StatusInfo } from '$lib/types';
import { activeBusyMinutes, defaultPrepMinutes } from '$lib/utils/order-rules';
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
	/** Extra prep minutes from busy mode right now; 0 when it is off or has run out. */
	busyMinutes = $derived(this.info ? activeBusyMinutes(this.info, clock.now.getTime()) : 0);
	/** What a new ASAP order gets: the usual prep time plus busy minutes. */
	prepMinutes = $derived(this.info ? defaultPrepMinutes(this.info, clock.now.getTime()) : null);
	/** Sales, performance and order history are for managers and owners. */
	canSeeReports = $derived(!!this.profile && this.profile.role !== 'employee');
	/** Switching auto-accept needs a manager or owner (store:ordering). */
	canSetAutoAccept = $derived(!!this.profile && this.profile.role !== 'employee');

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

	setBusy(extraMinutes: BusyMinutes, durationMinutes: BusyDuration | null) {
		return this.#run(() => restaurantService.setBusy(extraMinutes, durationMinutes));
	}

	clearBusy() {
		return this.#run(() => restaurantService.clearBusy());
	}

	setAutoAccept(enabled: boolean) {
		return this.#run(() => restaurantService.setAutoAccept(enabled));
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
