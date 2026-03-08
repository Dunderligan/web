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

export function isAdmin(userRole: AuthRole | undefined | null): boolean {
	return checkPermission(userRole, AuthRole.ADMIN);
}

export function isModerator(userRole: AuthRole | undefined | null): boolean {
	return checkPermission(userRole, AuthRole.MODERATOR);
}

export function canPromoteTo(userRole: AuthRole | undefined | null, targetRole: AuthRole): boolean {
	if (!userRole) {
		return false;
	}

	// can only promote to any level below the user's current role
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
