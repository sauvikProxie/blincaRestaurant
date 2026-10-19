import { ConvexClient } from 'convex/browser';
import { PUBLIC_CONVEX_URL } from '$env/static/public';

let client: ConvexClient | null = null;

/** The one Convex connection, opened on first use. Queries through it stay live over a websocket. */
export function convex(): ConvexClient {
	// No "unsaved changes" prompt: it would block closing the Tauri window.
	client ??= new ConvexClient(PUBLIC_CONVEX_URL, { unsavedChangesWarning: false });
	return client;
}
