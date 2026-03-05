import { browser } from '$app/environment';
import { getRequestEvent } from '$app/server';
import { page } from '$app/state';
import type { User } from './server/db/schema/auth';

export enum AuthRole {
	SUPER_ADMIN = 'super_admin',
	ADMIN = 'admin',
	MODERATOR = 'moderator',
	USER = 'user'
}

const roleHierarchy = [AuthRole.USER, AuthRole.MODERATOR, AuthRole.ADMIN, AuthRole.SUPER_ADMIN];

export function compareRoles(roleA: AuthRole, roleB: AuthRole): number {
	const indexA = roleHierarchy.indexOf(roleA);
	const indexB = roleHierarchy.indexOf(roleB);
	return indexA - indexB;
}

export function checkPermission(
	userRole: AuthRole | undefined | null,
	requiredRole: AuthRole
): boolean {
	if (!userRole) {
		return false;
	}

	return compareRoles(userRole, requiredRole) >= 0;
}

/** Like checkPermission but checks the currently logged in user. */
export function checkUserPermission(requiredRole: AuthRole): boolean {
	let user: User | null;
	if (browser) {
		user = page.data.user;
	} else {
		const { locals } = getRequestEvent();
		user = locals.user;
	}
	return checkPermission(user?.role, requiredRole);
}

export function canPromoteTo(userRole: AuthRole | undefined | null, targetRole: AuthRole): boolean {
	if (!userRole) {
		return false;
	}

	// can only promote to one level below the user's current role
	return compareRoles(userRole, targetRole) > 0;
}

export function formatRole(role: AuthRole): string {
	switch (role) {
		case AuthRole.SUPER_ADMIN:
			return 'Superadmin';
		case AuthRole.ADMIN:
			return 'Admin';
		case AuthRole.MODERATOR:
			return 'Moderator';
		case AuthRole.USER:
			return 'Användare';
	}
}
