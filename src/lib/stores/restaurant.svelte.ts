import { scheduleService, statusService } from '$lib/services';
import type { Schedule, StatusOverride } from '$lib/types';
import { newId } from '$lib/utils/id';
import {
	createOverride,
	getRestaurantStatus,
	isOverrideActive,
	resolveToggle
} from '$lib/utils/restaurant-status';
import { clock } from './clock.svelte';

/** Schedule, manual overrides and the live Open/Closed status derived from them. */
class RestaurantStore {
	schedule = $state<Schedule | null>(null);
	overrides = $state<StatusOverride[]>([]);
	loading = $state(true);
	error = $state<Error | null>(null);
	busy = $state(false);

	status = $derived(
		this.schedule ? getRestaurantStatus(this.schedule, this.overrides.at(-1) ?? null, clock.now) : null
	);

	async load() {
		this.loading = true;
		this.error = null;
		try {
			const [schedule, overrides] = await Promise.all([scheduleService.get(), statusService.listOverrides()]);
			this.schedule = schedule;
			this.overrides = overrides;
		} catch (error) {
			this.error = error instanceof Error ? error : new Error(String(error));
		} finally {
			this.loading = false;
		}
	}

	async saveSchedule(schedule: Schedule) {
		this.schedule = await scheduleService.save(schedule);
	}

	/** Flips Open/Closed. Flipping back to what the schedule says returns to schedule. */
	async toggle() {
		if (!this.status || !this.schedule) return;
		const decision = resolveToggle(this.status);
		if (decision.action === 'return-to-schedule') return this.returnToSchedule();

		const now = new Date();
		const override = createOverride(this.schedule, decision.status, now, newId('ovr'));
		await this.#run(async () => {
			const current = this.#activeOverride(now);
			if (current) await statusService.endOverride(current.id, now.toISOString());
			await statusService.startOverride(override);
			this.overrides = this.overrides
				.map((o) => (o.id === current?.id ? { ...o, endedAt: now.toISOString() } : o))
				.concat(override);
		});
	}

	async returnToSchedule() {
		const now = new Date();
		const current = this.#activeOverride(now);
		if (!current) return;
		await this.#run(async () => {
			await statusService.endOverride(current.id, now.toISOString());
			this.overrides = this.overrides.map((o) => (o.id === current.id ? { ...o, endedAt: now.toISOString() } : o));
		});
	}

	#activeOverride(now: Date) {
		const last = this.overrides.at(-1) ?? null;
		return isOverrideActive(last, now) ? last : null;
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
