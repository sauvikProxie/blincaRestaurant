import { notificationsService, type Unsubscribe } from '$lib/services';
import type { NotificationFeed, NotificationKind, SoundSettings, Tone } from '$lib/types';
import { createChime } from '$lib/utils/alert-sound';
import { ringingArrivals } from '$lib/utils/notifications';
import { liveOrders } from './live-orders.svelte';

/** How often "repeat until accepted" rings while an order waits. */
const REPEAT_EVERY_MS = 10_000;

/** Input events a webview counts as a user gesture, which audio needs before it may play. */
const GESTURES = ['click', 'keydown', 'touchend'] as const;

/**
 * The notification feed, kept live by the backend, and the alert sound.
 * Settings (tone, volume, muted kinds) are saved per login on the backend.
 */
class NotificationsStore {
	feed = $state<NotificationFeed | null>(null);
	error = $state<Error | null>(null);
	/** The webview lets this app play sound. False until the first tap on some devices. */
	soundUnlocked = $state(false);
	/** The settings dialog, opened from the notification panel. */
	settingsOpen = $state(false);

	unreadCount = $derived(this.feed?.unreadCount ?? 0);
	sound = $derived<SoundSettings | null>(this.feed?.settings.sound ?? null);
	/** Sound is switched on but the webview still blocks it: one tap anywhere fixes that. */
	soundBlocked = $derived(!!this.sound?.enabled && !this.soundUnlocked);

	#chime = createChime();
	#seen: Set<string> | null = null;
	#unsubscribe: Unsubscribe | null = null;
	#repeat: ReturnType<typeof setInterval> | undefined;

	connect() {
		if (this.#unsubscribe) return;
		this.#unsubscribe = notificationsService.watchFeed(
			(feed) => {
				const { ring, seen } = ringingArrivals(this.#seen, feed.items);
				this.#seen = seen;
				this.feed = feed;
				this.error = null;
				if (ring) void this.ring();
			},
			(error) => (this.error = error)
		);
		// Keep ringing while an order waits to be accepted, if the staff member wants that.
		this.#repeat = setInterval(() => {
			const sound = this.sound;
			if (sound?.enabled && sound.repeatUntilAccepted && liveOrders.newCount > 0) void this.ring();
		}, REPEAT_EVERY_MS);
		// Desktop webviews often allow audio straight away; elsewhere the first tap unlocks it.
		void this.unlock();
		for (const type of GESTURES) window.addEventListener(type, this.#onGesture, { capture: true });
	}

	disconnect() {
		this.#unsubscribe?.();
		this.#unsubscribe = null;
		clearInterval(this.#repeat);
		this.#repeat = undefined;
		for (const type of GESTURES) window.removeEventListener(type, this.#onGesture, { capture: true });
		this.#seen = null;
		this.feed = null;
		this.error = null;
		this.settingsOpen = false;
	}

	/** Asks the webview for audio. Must run inside a tap or key press where the device demands it. */
	async unlock(): Promise<boolean> {
		this.soundUnlocked = await this.#chime.unlock();
		return this.soundUnlocked;
	}

	async ring() {
		const sound = this.sound;
		if (!sound?.enabled) return;
		if (!(await this.#chime.play(sound.tone, sound.volume))) this.soundUnlocked = false;
	}

	/** Plays a tone from the settings dialog before it is saved. */
	async test(tone: Tone, volume: number) {
		if (await this.unlock()) await this.#chime.play(tone, volume);
	}

	markRead(id: string) {
		return notificationsService.markRead(id);
	}

	markAllRead() {
		return notificationsService.markAllRead();
	}

	saveSettings(settings: { sound: SoundSettings; mutedKinds: NotificationKind[] }) {
		return notificationsService.updateSettings(settings);
	}

	#onGesture = () => {
		if (this.soundUnlocked) return;
		void this.unlock();
	};
}

export const notifications = new NotificationsStore();
