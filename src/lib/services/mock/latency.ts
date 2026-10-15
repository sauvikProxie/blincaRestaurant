import { appConfig } from '$lib/config/app.config';

const { latencyMs, failureRate } = appConfig.mock;

/**
 * Wraps a mock call with network-like latency and optional random failures,
 * and returns a copy so callers can't mutate the mock store.
 */
export async function mockRequest<T>(work: () => T): Promise<T> {
	const delay = latencyMs.min + Math.random() * (latencyMs.max - latencyMs.min);
	await new Promise((resolve) => setTimeout(resolve, delay));
	if (Math.random() < failureRate) throw new Error('Mock request failed');
	return structuredClone(work());
}
