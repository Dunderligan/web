# Agents

The Swedish community tournament Dunderligan's site (production: dunderligan.se, staging: dev.dunderligan.se), a full-stack SvelteKit NodeJS app.
All user-facing text is in Swedish, while code, comments and docs are in English.

## Commands

- `pnpm install`
- `pnpm dev` - Vite dev server on port 5173
- `pnpm check` - type check, always run before finishing
- `pnpm format` - Prettier write; `pnpm lint` - Prettier check + ESLint
- `pnpm db:push` - sync Drizzle schema to database
- `pnpm db:generate --name <snake_case>` - generate a migration (make sure to pull from main first)
- `pnpm db:migrate` - run migrations; don't run this on a DB managed by `db:push`
- `pnpm dev -- -- --seed` - run dev server with seeded data; **drops the current database**

## Stack

- SvelteKit 2, Svelte 5, adapter-node, experimental remote functions
- Drizzle ORM 1.0.0-beta release; make sure docs are up do date when reading
- Tailwind v4, Bits UI, Zod v4, Arctic (OAuth), S3 AWS SDK

## Layout

- Standard `src/routes`; the main pages live under `(app)` group (`(app)/+layout.svelte` provides scaffolding)
  - Landing page lives outside `(app)` since it defines its own layout (for instance the large video background)
- `src/lib/remote/*.remote.ts`: remote `query`/`command` mutations: Zod-validate, then `roleGuard(AuthRole.X)`
- `src/lib/server/db/schema/`: Drizzle schema, split by domain
- `src/lib/components/{ui,admin,form,match,table,structure}/`
- `src/lib/state/*.svelte.ts`: rune- and context-based client stores
- `docs/`: technical docs; update the relevant file when behavior changes
