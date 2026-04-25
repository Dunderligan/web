import z from 'zod';
import { MatchState, SocialPlatform } from './types';

/** Zod schema for remote functions that take matches as arguments. */
export const matchSchema = z.object({
	id: z.uuid(),
	rosterAId: z.string().nullish(),
	rosterBId: z.string().nullish(),
	teamAScore: z.int(),
	teamBScore: z.int(),
	draws: z.int(),
	teamANote: z.string().nullish(),
	teamBNote: z.string().nullish(),
	state: z.enum(MatchState),
	vodUrl: z.url().nullish(),
	scheduledAt: z.date().nullish(),
	playedAt: z.date().nullish()
});

export const socialSchema = z.object({
	platform: z.enum(SocialPlatform),
	url: z.url()
});

export const matchQueryParamsSchema = z.object({
	rosterId: z.uuid().optional(),
	divisionId: z.uuid().optional(),
	seasonId: z.uuid().optional(),
	state: z.array(z.enum(MatchState)).optional(),
	isBracket: z.boolean().optional(),
	page: z.number().min(0).default(0),
	pageSize: z.number().min(1).optional()
});
