/**
 * Better Auth over plain HTTP, with the session held as a bearer token.
 *
 * The backend's web apps keep the session in a first-party cookie through a
 * SvelteKit server proxy. This app has no server, so it uses what the
 * backend's `convex()` auth plugin already accepts without any backend change:
 *  - sign-in returns the session token in its JSON body,
 *  - `Authorization: Bearer <token>` stands in for the cookie on later calls,
 *  - GET /convex/token turns that session into the short-lived JWT Convex needs.
 */
import { PUBLIC_CONVEX_SITE_URL } from '$env/static/public';

const BASE_PATH = '/api/auth';

/** A non-2xx answer from Better Auth. `code` is its error code, e.g. INVALID_EMAIL_OR_PASSWORD. */
export class AuthHttpError extends Error {
	constructor(
		readonly status: number,
		readonly code: string | null,
		message: string
	) {
		super(message);
		this.name = 'AuthHttpError';
	}
}

const isTauri = () => typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;

async function send(path: string, init: { method: 'GET' | 'POST'; token?: string; body?: unknown }): Promise<unknown> {
	const headers = new Headers({ Accept: 'application/json' });
	if (init.token) headers.set('Authorization', `Bearer ${init.token}`);
	if (init.body !== undefined) headers.set('Content-Type', 'application/json');
	const request = { method: init.method, headers, body: init.body === undefined ? undefined : JSON.stringify(init.body) };

	let response: Response;
	if (isTauri()) {
		// The Convex site sends no CORS headers, so the request goes out from Rust.
		// An empty Origin makes the plugin send none: with no cookie in play,
		// Better Auth's CSRF origin check doesn't apply to a bearer-token client.
		headers.set('Origin', '');
		const { fetch: tauriFetch } = await import('@tauri-apps/plugin-http');
		response = await tauriFetch(`${PUBLIC_CONVEX_SITE_URL}${BASE_PATH}${path}`, request);
	} else {
		// Plain browser (npm run dev): same origin through the Vite proxy.
		response = await fetch(`${BASE_PATH}${path}`, { ...request, credentials: 'omit' });
	}

	const data: unknown = await response.json().catch(() => null);
	if (!response.ok) {
		const error = (data ?? {}) as { code?: unknown; message?: unknown };
		throw new AuthHttpError(
			response.status,
			typeof error.code === 'string' ? error.code : null,
			typeof error.message === 'string' ? error.message : `Auth request failed (${response.status})`
		);
	}
	return data;
}

export interface SignInResult {
	token: string;
	user: { name: string; email: string };
}

export async function signInWithEmail(email: string, password: string): Promise<SignInResult> {
	const data = (await send('/sign-in/email', { method: 'POST', body: { email, password } })) as {
		token?: string;
		user?: { name?: string; email?: string };
	};
	if (!data?.token) throw new AuthHttpError(500, null, 'Sign-in returned no session token');
	return { token: data.token, user: { name: data.user?.name ?? '', email: data.user?.email ?? email } };
}

/** A fresh Convex JWT (valid ~15 min) for the session, or null once the session has ended. */
export async function fetchConvexToken(sessionToken: string): Promise<string | null> {
	try {
		const data = (await send('/convex/token', { method: 'GET', token: sessionToken })) as { token?: string };
		return data?.token ?? null;
	} catch (error) {
		if (error instanceof AuthHttpError && error.status === 401) return null;
		throw error;
	}
}

export async function signOutSession(sessionToken: string): Promise<void> {
	await send('/sign-out', { method: 'POST', token: sessionToken, body: {} });
}
