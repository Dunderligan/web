import { browser } from '$app/environment';
import { deleteCookie, setCookie } from '$lib/util';
import { defineContext } from './util';

const { get, set } = defineContext<ThemeState>('$_theme_state');

/** Context for light/dark mode.
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
export class ThemeState {
	static get = get;
	static set = set;

	current: string = $state('light');

	constructor(theme: string | null) {
		this.setTheme(theme);
	}

	setTheme(theme: string | null) {
		if (!theme) {
			theme = 'light';
		}

		this.current = theme;
		if (this.current) {
			setCookie('theme', theme);
		}

		if (browser) {
			// Bits UI floating elements live outside the theme wrapper (in the root layout.svelte)
			// and thus don't get affected by its class changes. We set the class on the html root
			// element to cover this.

			// Even though this technically breaks server/client rendering consistency, it usually
			// only matters for components outside the initial load (like dialogs and dropdown menus).

			// FYI we can't *only* do this due to not being able to access the html root during SSR,
			// and not setting the class at all during SSR would lead to much bigger inconsistencies.
			if (this.current === 'dark') {
				document.documentElement.classList.add('dark');
			} else {
				document.documentElement.classList.remove('dark');
			}
		}
	}
}
