import adapter from '@sveltejs/adapter-node';
import { svelteDevtools } from '@sveltejs/vite-devtools-svelte';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	devtools: { apply: 'serve' },
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
