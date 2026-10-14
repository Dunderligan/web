import { configDefaults, defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config';

// Vitest runs in Node by default, which fits the decoupled logic in `src/lib`
// (standings, brackets, match helpers, rank math, and so on).
// Component tests, if added later, should live in a separate browser project.
export default mergeConfig(
	viteConfig,
	defineConfig({
		test: {
			name: 'unit',
			environment: 'node',
			include: ['src/**/*.{test,spec}.ts'],
			// Svelte component tests need a browser environment and are excluded here.
			exclude: [...configDefaults.exclude, 'src/**/*.svelte.{test,spec}.ts'],
			// TODO: remove once the first tests exist, so a broken include glob fails loudly.
			passWithNoTests: true
		}
	})
);
