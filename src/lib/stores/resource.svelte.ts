/**
 * Loading / error / data state for one async request, so every view can show
 * the same loading, empty and error states.
 */
export class Resource<T> {
	data = $state<T | undefined>(undefined);
	loading = $state(true);
	error = $state<Error | null>(null);
	#fetcher: () => Promise<T>;
	#request = 0;

	constructor(fetcher: () => Promise<T>) {
		this.#fetcher = fetcher;
	}

	/** Runs the request. Only the latest call wins if several overlap. */
	async load(): Promise<void> {
		const request = ++this.#request;
		this.loading = true;
		this.error = null;
		try {
			const data = await this.#fetcher();
			if (request === this.#request) this.data = data;
		} catch (error) {
			if (request === this.#request) this.error = error instanceof Error ? error : new Error(String(error));
		} finally {
			if (request === this.#request) this.loading = false;
		}
	}
}
