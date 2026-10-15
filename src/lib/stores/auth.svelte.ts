import { authService } from '$lib/services';
import { storage } from '$lib/services/storage';
import type { Credentials, Session } from '$lib/types';

const KEY = 'auth:session';

/** The signed-in session, kept across restarts until the user signs out. */
class AuthStore {
	session = $state<Session | null>(storage.get<Session | null>(KEY, null));

	async signIn(credentials: Credentials) {
		const session = await authService.signIn(credentials);
		storage.set(KEY, session);
		this.session = session;
	}

	/** Signs out on this device straight away; the server call can't stop it. */
	async signOut() {
		this.session = null;
		storage.remove(KEY);
		try {
			await authService.signOut();
		} catch {
			// Nothing to undo: the local session is already gone.
		}
	}
}

export const auth = new AuthStore();
