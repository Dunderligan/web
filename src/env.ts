import { defineEnvVars } from '@sveltejs/kit/env';
import { z } from 'zod';

/**
 * Environment variables available through `$app/env/private` and `$app/env/public`.
 * Optional values are typed as `string | undefined` so callers can fall back.
 */
export const variables = defineEnvVars({
	DATABASE_URL: {
		description: 'PostgreSQL connection string',
		schema: z.string()
	},
	AUTH_URL: {
		description: 'Public origin used to build OAuth redirect URIs',
		schema: z.string()
	},
	BATTLENET_CLIENT_ID: {
		description: 'Blizzard Battle.net OAuth client id',
		schema: z.string()
	},
	BATTLENET_CLIENT_SECRET: {
		description: 'Blizzard Battle.net OAuth client secret',
		schema: z.string()
	},
	REDIS_URL: {
		description: 'Redis connection string used to cache Overwatch profile queries',
		schema: z.string().optional()
	},
	S3_ENDPOINT: {
		description: 'S3-compatible storage endpoint',
		schema: z.string()
	},
	S3_ACCESS_KEY_ID: {
		description: 'S3-compatible storage access key id',
		schema: z.string()
	},
	S3_SECRET_ACCESS_KEY: {
		description: 'S3-compatible storage secret access key',
		schema: z.string()
	},
	S3_BUCKET_NAME: {
		description: 'S3-compatible storage bucket for team logos',
		schema: z.string()
	},
	SOURCE_COMMIT: {
		description: 'Current git commit hash, set by Coolify',
		schema: z.string().optional()
	},
	FORBID_CRAWLING: {
		description: 'When "true", serves a robots.txt that forbids all crawling',
		schema: z.string().optional()
	},
	CDN_ENDPOINT: {
		description: 'Origin where images and some static assets are served from',
		public: true,
		schema: z.string()
	}
});
