export interface Toast {
	id: number;
	message: string;
	tone: 'default' | 'success' | 'error';
	action?: { label: string; run: () => void };
}

const DURATION_MS = 5000;

class Toasts {
	items = $state<Toast[]>([]);
	#nextId = 1;

	show(message: string, options: Omit<Partial<Toast>, 'id' | 'message'> = {}): number {
		const id = this.#nextId++;
		this.items = [...this.items, { id, message, tone: options.tone ?? 'default', action: options.action }];
		setTimeout(() => this.dismiss(id), DURATION_MS);
		return id;
	}

	success(message: string, action?: Toast['action']) {
		return this.show(message, { tone: 'success', action });
	}

	error(message: string) {
		return this.show(message, { tone: 'error' });
	}

	dismiss(id: number) {
		this.items = this.items.filter((toast) => toast.id !== id);
	}
}

export const toasts = new Toasts();
