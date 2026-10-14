import { configDefaults, defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config';

export default mergeConfig(
	viteConfig,
	defineConfig({
		test: {
			name: 'unit',
			environment: 'node',
			include: ['src/**/*.{test,spec}.ts'],
			exclude: [...configDefaults.exclude, 'src/**/*.svelte.{test,spec}.ts']
		}
	})
);
