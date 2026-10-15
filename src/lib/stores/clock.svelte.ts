/** Re-evaluate often enough that status flips land within a few seconds of the scheduled time. */
const TICK_MS = 10_000;

/** A shared, reactive "now" so time-based UI (status, "x min ago") updates without a refresh. */
class Clock {
	now = $state(new Date());
	#timer: ReturnType<typeof setInterval> | undefined;

	start() {
		if (this.#timer) return;
		this.now = new Date();
		this.#timer = setInterval(() => (this.now = new Date()), TICK_MS);
	}

	stop() {
		clearInterval(this.#timer);
		this.#timer = undefined;
	}
}

export const clock = new Clock();
