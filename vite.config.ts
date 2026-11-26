import adapter from '@sveltejs/adapter-node';
import { svelteDevtools } from '@sveltejs/vite-devtools-svelte';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	// `clientAuth: false` skips the one-time code for the dock. The dev server only
	// listens on localhost, so only this machine can reach it.
	devtools: { apply: 'serve', clientAuth: false },
	plugins: [
		svelteDevtools(),
		tailwindcss(),
		sveltekit({
			preprocess: vitePreprocess(),
			adapter: adapter(),
			experimental: { remoteFunctions: true }
		})
	]
});
