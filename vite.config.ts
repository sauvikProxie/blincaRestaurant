import { sveltekit } from '@sveltejs/kit/vite';
import { loadEnv, type ProxyOptions } from 'vite';
import { defineConfig } from 'vitest/config';

/** Set by `tauri android dev` so the emulator can reach the dev server over the network. */
const host = process.env.TAURI_DEV_HOST;

/**
 * Browser-only dev path to Better Auth on the Convex site URL, which sends no
 * CORS headers. The app authenticates with a bearer token, so cookies are
 * stripped both ways: none go up, and the sign-in response can't overwrite
 * another localhost app's session cookie (cookies ignore ports).
 * Inside Tauri the app calls the site URL directly via the HTTP plugin instead.
 */
function authProxy(target: string): Record<string, ProxyOptions> {
	return {
		'/api/auth': {
			target,
			changeOrigin: true,
			configure: (proxy) => {
				proxy.on('proxyReq', (request) => request.removeHeader('cookie'));
				proxy.on('proxyRes', (response) => {
					delete response.headers['set-cookie'];
				});
			}
		}
	};
}

export default defineConfig(({ mode }) => {
	const siteUrl = loadEnv(mode, process.cwd(), 'PUBLIC_').PUBLIC_CONVEX_SITE_URL;
	const proxy = siteUrl ? authProxy(siteUrl) : undefined;

	return {
		plugins: [sveltekit()],
		// Tauri expects a fixed port and must not have the terminal cleared.
		clearScreen: false,
		server: {
			port: 5173,
			strictPort: true,
			host: host || false,
			hmr: host ? { protocol: 'ws', host, port: 5174 } : undefined,
			// Fonts and logos are served straight from the brand Assets folder.
			fs: { allow: ['Assets'] },
			watch: { ignored: ['**/src-tauri/**'] },
			proxy
		},
		preview: { proxy },
		test: {
			include: ['src/**/*.test.ts'],
			environment: 'node'
		}
	};
});
