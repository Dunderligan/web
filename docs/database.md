# Database

This project uses [PostgreSQL](https://www.postgresql.org/) as its database, with [Drizzle ORM](https://orm.drizzle.team/) as the query builder/ORM and migration tool.

The schema is defined in `src/lib/server/db/schema/` using Drizzle's TypeScript API. For local development, `drizzle-kit push` (also available as `pnpm db:push`) is used to quickly sync the schema to the database. For production, SQL migrations are used instead (from `drizzle-kit generate`/`pnpm db:generate`). See below for more instructions.

> [!IMPORTANT]
> Currently, a beta release of Drizzle 1.0.0 is used. This may be important when looking up documentation!

## Seeding

While developing, it can be useful to have test data to play around with. The project includes a feature to randomly generate a "realistic" season with teams, matches, players, etc.

To get started, shut down the dev server and start it up again with the `--seed` argument:

```bash
pnpm dev -- -- --seed
```

> [!CAUTION]
> `--seed` will clear the current database. Do **not** use it on data you hold dear!

Then, visit any page on `localhost:5173` and wait a few seconds for the database to be populated.

## Queries

The project uses both Drizzle's standard query builder and the relational API. Relational queries are used for data fetching when possible, but due to Drizzle limitations, some queries have to use the standard builder.

## Migrations

Whenever you make changes to the schema during development, use `pnpm db:push` to easily sync the schema to the database.

When you're ready to commit your changes, generate a new SQL migration with:

```bash
pnpm db:generate --name [name]
```

This will create a new SQL migration file in `drizzle/migrations/` which will be ran against the production database on deploy. You can also try them out locally with:

```bash
pnpm db:migrate
```
