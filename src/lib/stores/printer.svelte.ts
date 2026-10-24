import { tick } from 'svelte';
import { errorMessage } from '$lib/convex/errors';
import { ordersService } from '$lib/services';
import { storage } from '$lib/services/storage';
import type { KitchenTicket } from '$lib/types';
import { canPrint } from '$lib/utils/print';
import { toasts } from './toasts.svelte';

const AUTO_PRINT_KEY = 'print:auto';
/** Gives up waiting for the print dialog after this, so the queue never sticks. */
const PRINT_TIMEOUT_MS = 30_000;

/** Opens the system print dialog and resolves once it closes. */
function printPage(): Promise<void> {
	return new Promise((resolve) => {
		const done = () => {
			window.removeEventListener('afterprint', done);
			clearTimeout(timer);
			resolve();
		};
		const timer = setTimeout(done, PRINT_TIMEOUT_MS);
		window.addEventListener('afterprint', done);
		requestAnimationFrame(() => window.print());
	});
}

/**
 * Kitchen tickets, printed one at a time through the system print dialog.
 * Auto-print is a setting of this device (the printer belongs to the device,
 * not to the login), so it lives in local storage.
 */
class Printer {
	readonly supported = canPrint();
	/** The ticket on the print page right now. */
	ticket = $state<KitchenTicket | null>(null);
	autoPrint = $state(storage.get(AUTO_PRINT_KEY, false));
	/** Order ids waiting to print, current one first. */
	queue = $state<string[]>([]);
	#running = false;

	setAutoPrint(on: boolean) {
		this.autoPrint = on;
		storage.set(AUTO_PRINT_KEY, on);
	}

	print(orderId: string) {
		if (!this.supported || this.queue.includes(orderId)) return;
		this.queue = [...this.queue, orderId];
		void this.#drain();
	}

	async #drain() {
		if (this.#running) return;
		this.#running = true;
		try {
			while (this.queue.length) {
				const id = this.queue[0];
				try {
					this.ticket = await ordersService.ticket(id);
					await tick();
					await printPage();
				} catch (error) {
					toasts.error(`Couldn't print the ticket. ${errorMessage(error)}`);
				} finally {
					this.ticket = null;
					this.queue = this.queue.slice(1);
				}
			}
		} finally {
			this.#running = false;
		}
	}
}

export const printer = new Printer();
