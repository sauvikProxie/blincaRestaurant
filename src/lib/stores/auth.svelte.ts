import { authService } from '$lib/services';
import { storage } from '$lib/services/storage';
import type { Credentials, Session } from '$lib/types';

const KEY = 'auth:session';

/** Sessions saved by older builds have no token and can't be used. */
function savedSession(): Session | null {
	const session = storage.get<Session | null>(KEY, null);
	return session?.token ? session : null;
}

/** The signed-in session, kept across restarts until the user signs out or the backend ends it. */
class AuthStore {
	session = $state<Session | null>(savedSession());
	/** True when the backend ended the session, so the sign-in page can say why. */
	expired = $state(false);

	async signIn(credentials: Credentials) {
		const session = await authService.signIn(credentials);
		storage.set(KEY, session);
		this.expired = false;
		this.session = session;
	}

	/** Uses the saved session for live data. Safe to call more than once. */
	connect() {
		if (this.session) authService.connect(this.session, () => this.#expire());
	}

	/** Signs out on this device straight away; the server call can't stop it. */
	async signOut() {
		const session = this.session;
		this.session = null;
		storage.remove(KEY);
		if (!session) return;
		try {
			await authService.signOut(session);
		} catch {
			// Nothing to undo: the local session is already gone.
		}
	}

	#expire() {
		if (!this.session) return;
		this.session = null;
		storage.remove(KEY);
		this.expired = true;
	}
}

export const auth = new AuthStore();
