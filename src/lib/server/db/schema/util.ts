import { and, not, or, type SQL } from 'drizzle-orm';

/**
 * Convert a TypeScript enum to a Postgres enum representation.
 * This is taken from somewhere (maybe deep in the Drizzle docs?).
 */
export function enumToPgEnum<T extends Record<string, any>>(
	myEnum: T
): [T[keyof T], ...T[keyof T][]] {
	return Object.values(myEnum).map((value: any) => `${value}`) as any;
}

export function xor(a: SQL<unknown>, b: SQL<unknown>): SQL<unknown> {
	// first-order conjunctive normal form btw 😎
	return and(or(not(a), not(b)), or(a, b))!;
}
