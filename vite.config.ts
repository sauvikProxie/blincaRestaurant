import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';

/** Set by `tauri android dev` so the emulator can reach the dev server over the network. */
const host = process.env.TAURI_DEV_HOST;

export default defineConfig({
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
		watch: { ignored: ['**/src-tauri/**'] }
	},
	test: {
		include: ['src/**/*.test.ts'],
		environment: 'node'
	}
});
