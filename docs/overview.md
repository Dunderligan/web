# Overview

The tech stack in short:

- [SvelteKit](https://svelte.dev/) (fullstack)
  - Experimental [remote functions](https://svelte.dev/docs/kit/remote-functions) for mutations.
- [PostgreSQL](https://www.postgresql.org/)
- [Drizzle ORM](https://orm.drizzle.team/)
- [Cloudflare R2](https://www.cloudflare.com/developer-platform/products/r2/) + [Cloudflare Images](https://www.cloudflare.com/developer-platform/products/cloudflare-images/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Bits UI](https://bits-ui.com/) (headless components)

## Development

### Prerequisites

You'll need these installed:

- [NodeJS](https://nodejs.org/en)
- [pnpm](https://pnpm.io/)

A development database is also required. The simplest way to get started is to install PostgreSQL locally, which you can find installation instructions for on [the official website](https://www.postgresql.org/download/). Alternatively, you can run it within a Docker container, or use a cloud service like [Neon](https://neon.tech/) (free tier).

### Getting started

Clone the repository and navigate to it:

```bash
git clone https://github.com/Dunderligan/web
cd hemsida
```

Copy the `.env.example` file to `.env` and fill in the `DATABASE_URL` field with the URL of your database:

```env
DATABASE_URL="postgresql://[user]:[password]@[host]/[database]"
```

For example, on a local database named `dunderligan` using the root postgres user:

```env
DATABASE_URL="postgresql://postgres:[password]@localhost/dunderligan"
```

> [!NOTE]
> While the rest of the environment variables are not necessary for core functionality, some notable features will be unavailable when the values are left as default. This includes account logins and team logos (both load and upload).

Then run the following commands:

```bash
pnpm install
pnpm db:push
pnpm dev
```

Open up http://localhost:5173/setup in a browser, where the website will ask you to create a "superadmin" user. This user is the only one who can promote other admins.

> [!NOTE]
> Currently, only Battle.net authentication is supported. This has implications if you lose the session credentials to the superuser. In that case, you'll either have to manually edit the database, or make sure you signed up with a battletag you have access to (and [setup Battle.net OAuth](./cloud-services.md#battlenet)).

### Formatting

The project uses [Prettier](https://prettier.io/) for code formatting. **Always format your code before contributing.** This can be done via your editor (for example with the Prettier VSCode extension), or by running `pnpm format`.

### Next steps

- [Cloud services (for the full setup)](./cloud-services.md)
- [Database documentation](./database.md)

### Contributing

New contributions are always welcome! Just make sure to follow these:

- Adhere to the tournament code of conduct ([discord message link](https://discord.com/channels/631178408268660756/1077717324049690765/1345763447589044284))
- Make sure to target the `dev` branch with your pull request **(important!)**
- Please contact Dunderligan management if you wish to make larger changes 
- Prefer to split larger PRs into smaller chunks
