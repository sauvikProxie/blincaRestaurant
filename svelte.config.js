import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	kit: {
		// Static SPA: every route falls back to index.html (no SSR), as Tauri requires.
		adapter: adapter({ fallback: 'index.html' }),
		alias: {
			// Brand files are loaded straight from the Assets folder, never copied.
			$brand: './Assets'
		}
	}
};

export default config;
