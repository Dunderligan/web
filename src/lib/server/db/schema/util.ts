import { and, isNotNull, isNull, or, type SQL } from 'drizzle-orm';
import { timestamp } from 'drizzle-orm/pg-core';

export const timestamps = {
	createdAt: timestamp().defaultNow().notNull()
};

export function enumToPgEnum<T extends Record<string, any>>(
	myEnum: T
): [T[keyof T], ...T[keyof T][]] {
	return Object.values(myEnum).map((value: any) => `${value}`) as any;
}

export function xor(a: SQL<unknown>, b: SQL<unknown>) {
	return and(or(isNotNull(a), isNotNull(b)), or(isNull(a), isNull(b)))!;
}
