import { getContext, setContext } from 'svelte';

export function defineContext<T>(key: string) {
	return {
		get: () => getContext<T>(key),
		set: (value: T) => setContext(key, value)
	};
}
