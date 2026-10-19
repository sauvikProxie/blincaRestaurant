import { api } from '$lib/convex/api';
import { AuthHttpError, fetchConvexToken, signInWithEmail, signOutSession } from '$lib/convex/auth-http';
import { convex } from '$lib/convex/client';
import { errorCode } from '$lib/convex/errors';
import type { Session } from '$lib/types';
import { InvalidCredentialsError, NoRestaurantAccessError, TooManyAttemptsError } from '../errors';
import type { AuthService } from '../types';

const MAX_RETRY_MS = 30_000;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function createConvexAuthService(): AuthService {
	/** Bumped on every connect/sign-out so a stale token fetch can't apply to a newer session. */
	let generation = 0;
	let connectedToken: string | null = null;
	let onExpired: () => void = () => {};

	/**
	 * Convex asks for a JWT on connect and again shortly before each one expires.
	 * A kitchen tablet can drop off wifi, so network failures are retried rather
	 * than treated as a sign-out; only a definite "session ended" returns null.
	 */
	async function tokenFor(sessionToken: string, gen: number): Promise<string | null> {
		for (let delay = 1000; gen === generation; delay = Math.min(delay * 2, MAX_RETRY_MS)) {
			try {
				return await fetchConvexToken(sessionToken);
			} catch {
				await sleep(delay);
			}
		}
		return null;
	}

	function connect(session: Session, expired: () => void) {
		onExpired = expired;
		if (connectedToken === session.token) return;
		connectedToken = session.token;
		const gen = ++generation;
		convex().setAuth(
			() => tokenFor(session.token, gen),
			(isAuthenticated) => {
				if (!isAuthenticated && gen === generation) onExpired();
			}
		);
	}

	function disconnect() {
		generation++;
		connectedToken = null;
		convex().client.clearAuth();
	}

	return {
		async signIn({ email, password }) {
			let session: Session;
			try {
				const result = await signInWithEmail(email.trim(), password);
				session = {
					token: result.token,
					email: result.user.email,
					name: result.user.name,
					signedInAt: new Date().toISOString()
				};
			} catch (error) {
				if (error instanceof AuthHttpError) {
					if (error.status === 401 || error.code === 'INVALID_EMAIL_OR_PASSWORD') throw new InvalidCredentialsError();
					if (error.status === 429) throw new TooManyAttemptsError();
				}
				throw error;
			}

			// Any Better Auth account can sign in; only partner accounts with an active profile can run a restaurant.
			connect(session, () => {});
			try {
				await convex().query(api.partnerProfiles.me, {});
			} catch (error) {
				const code = errorCode(error);
				disconnect();
				await signOutSession(session.token).catch(() => {});
				if (code === 'FORBIDDEN') throw new NoRestaurantAccessError();
				if (code === 'ACCOUNT_INACTIVE') throw new NoRestaurantAccessError('This restaurant account has been switched off');
				throw error;
			}
			return session;
		},

		connect,

		async signOut(session) {
			disconnect();
			await signOutSession(session.token);
		}
	};
}
