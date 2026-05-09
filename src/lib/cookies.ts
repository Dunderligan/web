/** Client/server agnostic cookie functions */

import { browser } from '$app/environment';
import { getRequestEvent } from '$app/server';

export async function getCookie(name: string): Promise<string | null> {
	if (browser) {
		const cookie = await cookieStore.get(name);
		return cookie?.value ?? null;
	} else {
		const { cookies } = getRequestEvent();
		return cookies.get(name) ?? null;
	}
}

const COOKIE_EXPIRATION_MS = 365 * 24 * 60 * 60 * 1000; // 1 year

export function setCookie(name: string, value: string) {
	const expires = new Date(Date.now() + COOKIE_EXPIRATION_MS);
	if (browser) {
		document.cookie = `${name}=${value}; path=/; expires=${expires.toUTCString()}`;
	} else {
		const { cookies } = getRequestEvent();
		cookies.set(name, value, { path: '/', httpOnly: false, expires });
	}
}

export async function deleteCookie(name: string) {
	if (browser) {
		await cookieStore.delete(name);
	} else {
		const { cookies } = getRequestEvent();
		cookies.delete(name, { path: '/', httpOnly: false });
	}
}
