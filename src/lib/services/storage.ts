/**
 * Small wrapper around localStorage so user changes survive a refresh.
 * Every read and write is guarded: private mode or blocked storage just falls back.
 */
const PREFIX = 'blinca:';

export const storage = {
	get<T>(key: string, fallback: T): T {
		try {
			const raw = globalThis.localStorage?.getItem(PREFIX + key);
			return raw === null || raw === undefined ? fallback : (JSON.parse(raw) as T);
		} catch {
			return fallback;
		}
	},
	set<T>(key: string, value: T): void {
		try {
			globalThis.localStorage?.setItem(PREFIX + key, JSON.stringify(value));
		} catch {
			// Storage full or unavailable: changes still apply for this session.
		}
	},
	remove(key: string): void {
		try {
			globalThis.localStorage?.removeItem(PREFIX + key);
		} catch {
			// Storage unavailable: nothing was saved to remove.
		}
	}
};
