import * as z from 'zod';

export const matchSchema = z.object({
	id: z.uuid(),
	rosterAId: z.string().nullish(),
	rosterBId: z.string().nullish(),
	teamAScore: z.int().nullish(),
	teamBScore: z.int().nullish(),
	draws: z.int().nullish(),
	played: z.boolean(),
	vodUrl: z.url().nullish(),
	scheduledAt: z.date().nullish(),
	playedAt: z.date().nullish()
});
