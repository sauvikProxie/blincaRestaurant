/**
 * Alert tones synthesised with Web Audio, so no audio file ships with the app.
 * Same tones as the Blinca web portal. Webviews only allow audio after a user
 * gesture, so call unlock() from a tap or key press.
 */
import type { Tone } from '$lib/types';

/** Frequencies (Hz), note spacing and length (s) for each tone. */
const TONES: Record<Tone, { notes: number[]; gap: number; length: number }> = {
	chime: { notes: [880, 660], gap: 0.18, length: 0.16 },
	bell: { notes: [1318, 988, 1318], gap: 0.22, length: 0.4 },
	beep: { notes: [1000, 1000, 1000], gap: 0.15, length: 0.08 }
};

export interface Chime {
	/** True once audio is allowed to play. */
	unlock(): Promise<boolean>;
	/** False when the webview blocked it (audio not unlocked yet). */
	play(tone: Tone, volume: number): Promise<boolean>;
	close(): Promise<void>;
}

export function createChime(): Chime {
	let ctx: AudioContext | undefined;

	async function running(): Promise<AudioContext | null> {
		if (!ctx) return null;
		if (ctx.state !== 'running') {
			try {
				await ctx.resume();
			} catch {
				return null;
			}
		}
		return ctx.state === 'running' ? ctx : null;
	}

	return {
		async unlock() {
			try {
				ctx ??= new AudioContext();
			} catch {
				return false;
			}
			return (await running()) !== null;
		},

		async play(tone, volume) {
			const audio = await running();
			if (!audio) return false;
			const { notes, gap, length } = TONES[tone];
			const peak = Math.max(0.0002, (Math.min(100, Math.max(0, volume)) / 100) * 0.4);
			const start = audio.currentTime;
			notes.forEach((frequency, index) => {
				const at = start + index * gap;
				const osc = audio.createOscillator();
				const gain = audio.createGain();
				osc.frequency.value = frequency;
				gain.gain.setValueAtTime(0.0001, at);
				gain.gain.exponentialRampToValueAtTime(peak, at + 0.02);
				gain.gain.exponentialRampToValueAtTime(0.0001, at + length);
				osc.connect(gain).connect(audio.destination);
				osc.start(at);
				osc.stop(at + length + 0.01);
			});
			return true;
		},

		async close() {
			const closing = ctx;
			ctx = undefined;
			try {
				await closing?.close();
			} catch {
				// Already closed.
			}
		}
	};
}
