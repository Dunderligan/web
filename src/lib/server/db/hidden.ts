import { isAdmin } from '$lib/authRole';
import type { User } from './schema/auth';

export function canSeeHiddenSeasons(user?: User | null) {
	return isAdmin(user?.role);
}

export function hiddenSeasonFilter(user?: User | null) {
	return canSeeHiddenSeasons(user) ? undefined : false;
}

export function hiddenDivisionFilter(user?: User | null) {
	return {
		season: {
			hidden: hiddenSeasonFilter(user)
		}
	};
}

export function hiddenGroupFilter(user?: User | null) {
	return {
		division: hiddenDivisionFilter(user)
	};
}

export function hiddenBracketFilter(user?: User | null) {
	return {
		division: hiddenDivisionFilter(user)
	};
}

export function hiddenMatchFilter(user?: User | null) {
	return {
		AND: [
			{
				OR: [
					{
						groupId: {
							isNull: true as true
						}
					},
					{
						group: hiddenGroupFilter(user)
					}
				]
			},
			{
				OR: [
					{
						bracketId: {
							isNull: true as true
						}
					},
					{
						bracket: hiddenBracketFilter(user)
					}
				]
			}
		]
	};
}

export function canSeeSeason(season: { hidden: boolean }, user?: User | null): boolean {
	return !season.hidden || canSeeHiddenSeasons(user);
}
