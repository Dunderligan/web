import { describe, expect, it } from 'vitest';
import {
	AuthRole,
	canEditUserPage,
	canPromoteTo,
	checkPermission,
	compareRoles,
	isAdmin,
	isModerator
} from './auth-role';
import type { User } from './server/db/schema/auth';

function user(partial: Partial<User> = {}): User {
	return {
		id: 'user',
		battletag: 'player#1234',
		battlenetId: 123456,
		role: AuthRole.USER,
		createdAt: new Date('0'),
		...partial
	};
}

describe('compareRoles', () => {
	const hierarchy = [AuthRole.USER, AuthRole.MODERATOR, AuthRole.ADMIN, AuthRole.SUPER_ADMIN];

	it('returns a positive number when roleA is higher than roleB', () => {
		for (let i = 0; i < hierarchy.length; i++) {
			for (let j = 0; j < i; j++) {
				expect(compareRoles(hierarchy[i], hierarchy[j])).toBeGreaterThan(0);
			}
		}
	});

	it('returns a negative number when roleA is lower than roleB', () => {
		for (let i = 0; i < hierarchy.length; i++) {
			for (let j = i + 1; j < hierarchy.length; j++) {
				expect(compareRoles(hierarchy[i], hierarchy[j])).toBeLessThan(0);
			}
		}
	});

	it('returns 0 when roleA is equal to roleB', () => {
		for (const role of hierarchy) {
			expect(compareRoles(role, role)).toBe(0);
		}
	});
});

describe('checkPermission', () => {
	it('returns false when userRole is undefined or null', () => {
		expect(checkPermission(undefined, AuthRole.USER)).toBe(false);
		expect(checkPermission(null, AuthRole.USER)).toBe(false);
	});

	it('returns true when userRole is equal to requiredRole', () => {
		expect(checkPermission(AuthRole.USER, AuthRole.USER)).toBe(true);
		expect(checkPermission(AuthRole.MODERATOR, AuthRole.MODERATOR)).toBe(true);
		expect(checkPermission(AuthRole.ADMIN, AuthRole.ADMIN)).toBe(true);
		expect(checkPermission(AuthRole.SUPER_ADMIN, AuthRole.SUPER_ADMIN)).toBe(true);
	});

	it('returns true when userRole is higher than requiredRole', () => {
		expect(checkPermission(AuthRole.MODERATOR, AuthRole.USER)).toBe(true);
		expect(checkPermission(AuthRole.ADMIN, AuthRole.MODERATOR)).toBe(true);
		expect(checkPermission(AuthRole.SUPER_ADMIN, AuthRole.ADMIN)).toBe(true);
	});

	it('returns false when userRole is lower than requiredRole', () => {
		expect(checkPermission(AuthRole.USER, AuthRole.MODERATOR)).toBe(false);
		expect(checkPermission(AuthRole.MODERATOR, AuthRole.ADMIN)).toBe(false);
		expect(checkPermission(AuthRole.ADMIN, AuthRole.SUPER_ADMIN)).toBe(false);
	});
});

describe('isAdmin', () => {
	it('returns true for ADMIN and SUPER_ADMIN roles', () => {
		expect(isAdmin(AuthRole.ADMIN)).toBe(true);
		expect(isAdmin(AuthRole.SUPER_ADMIN)).toBe(true);
	});

	it('returns false for USER and MODERATOR roles', () => {
		expect(isAdmin(AuthRole.USER)).toBe(false);
		expect(isAdmin(AuthRole.MODERATOR)).toBe(false);
	});
});

describe('isModerator', () => {
	it('returns true for MODERATOR, ADMIN, and SUPER_ADMIN roles', () => {
		expect(isModerator(AuthRole.MODERATOR)).toBe(true);
		expect(isModerator(AuthRole.ADMIN)).toBe(true);
		expect(isModerator(AuthRole.SUPER_ADMIN)).toBe(true);
	});

	it('returns false for USER role', () => {
		expect(isModerator(AuthRole.USER)).toBe(false);
	});
});

describe('canEditUserPage', () => {
	it('returns false for undefined or null user', () => {
		expect(canEditUserPage(undefined, 'player#1234')).toBe(false);
		expect(canEditUserPage(null, 'player#1234')).toBe(false);
	});

	it('returns true for moderators', () => {
		expect(canEditUserPage(user({ role: AuthRole.MODERATOR }), 'player2#1234')).toBe(true);
	});

	it('returns true only for users editing their own page', () => {
		const testUser = user({ role: AuthRole.USER, battletag: 'player#1234' });

		expect(canEditUserPage(testUser, 'player#1234')).toBe(true);
		expect(canEditUserPage(testUser, 'player2#1234')).toBe(false);
	});

	it('returns false for incompetlete battletags', () => {
		const testUser = user({ role: AuthRole.USER, battletag: 'player#1234' });

		expect(canEditUserPage(testUser, 'player')).toBe(false);
	});
});

describe('canPromoteTo', () => {
	it('returns true for undefined or null userRole', () => {
		expect(canPromoteTo(undefined, AuthRole.USER)).toBe(false);
		expect(canPromoteTo(null, AuthRole.USER)).toBe(false);
	});

	it('returns true when userRole is higher than targetRole', () => {
		expect(canPromoteTo(AuthRole.ADMIN, AuthRole.MODERATOR)).toBe(true);
		expect(canPromoteTo(AuthRole.SUPER_ADMIN, AuthRole.ADMIN)).toBe(true);
	});

	it('returns false when userRole is equal to or lower than targetRole', () => {
		expect(canPromoteTo(AuthRole.MODERATOR, AuthRole.MODERATOR)).toBe(false);
		expect(canPromoteTo(AuthRole.USER, AuthRole.MODERATOR)).toBe(false);

		expect(canPromoteTo(AuthRole.ADMIN, AuthRole.ADMIN)).toBe(false);
		expect(canPromoteTo(AuthRole.ADMIN, AuthRole.SUPER_ADMIN)).toBe(false);
	});
});
