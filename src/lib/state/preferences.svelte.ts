import { browser } from '$app/environment';
import type { Preferences, Theme } from '$lib/types';
import { setCookie } from '$lib/util';
import type { Cookies } from '@sveltejs/kit';
import { defineContext } from './util';

const { get, set } = defineContext<PreferencesState>('$_preferences_state');

/**
 * Context for light/dark mode.
 *
 * Here's an overview of the theme system:
 * - On load, the server reads the `theme` cookie of the client (see root +layout.server.ts).
 * - During rendering, the root layout initializes this class using setContext,
 * 	 passing down the theme from the cookie. If no cookie is set, it defaults to 'light'.
 * - The root wrapper element gets a 'dark' class if the theme is 'dark', enabling the Tailwind `dark:` styles.
 * - On hydration, the client will call `setTheme` again with the same value. This will also set the class
 *   on the root html element. See the comment below for details.
 *
 * When the user updates the theme (see Navbar), the cookie is set and the $state in this class
 * triggers the wrapper to update its class accordingly.
 */
export class PreferencesState {
	static get = get;
	static set = set;

	current: Preferences = $state({ theme: 'light', spoilerMode: false });

	theme = $derived(this.current.theme);
	spoilerMode = $derived(this.current.spoilerMode);

	constructor(preferences: Preferences) {
		this.setTheme(preferences.theme);
		this.setSpoilerMode(preferences.spoilerMode);
	}

	setTheme(theme: Theme) {
		this.current.theme = theme;
		setCookie('theme', theme);

		if (browser) {
			// Bits UI floating elements live outside the wrapper that covers the entire page and
			// gets assigned the dark class (see the root layout.svelte), and thus don't get affected
			// by its class changes. We set the class here on the html root element to cover this.
			//
			// Even though this technically breaks server/client rendering consistency, it usually
			// only matters for components outside the initial load (like dialogs and dropdown menus).
			//
			// We can't *only* do this due to not being able to access the html root during SSR,
			// and not setting the class at all during SSR would lead to much bigger inconsistencies.
			if (theme === 'dark') {
				document.documentElement.classList.add('dark');
			} else {
				document.documentElement.classList.remove('dark');
			}
		}
	}

	setSpoilerMode(enabled: boolean) {
		this.current.spoilerMode = enabled;
		setCookie('spoilerMode', String(enabled));
	}
}

export function preferencesFromCookies(cookies: Cookies): Preferences {
	let theme = cookies.get('theme');
	if (theme !== 'light' && theme !== 'dark') {
		theme = 'light';
	}

	const spoilerMode = cookies.get('spoilerMode') === 'true';

	return { theme: theme as Theme, spoilerMode };
}
