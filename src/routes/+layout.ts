import { redirect } from '@sveltejs/kit';
import { auth } from '$lib/stores/auth.svelte';
import { safeRedirect } from '$lib/utils/auth';
import type { LayoutLoad } from './$types';

// Static single-page app: everything renders in the browser (adapter-static fallback, Tauri shell).
export const ssr = false;
export const prerender = false;

/** Route guard: every page needs a session, except the sign-in page itself. */
export const load: LayoutLoad = ({ url }) => {
	const onLogin = url.pathname === '/login';
	if (!auth.session && !onLogin) {
		redirect(307, `/login?redirectTo=${encodeURIComponent(url.pathname + url.search)}`);
	}
	if (auth.session && onLogin) redirect(307, safeRedirect(url.searchParams.get('redirectTo')));
};
