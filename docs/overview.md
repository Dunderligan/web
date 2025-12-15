# Overview

The tech stack in short:

- [SvelteKit](https://svelte.dev/) (fullstack)
    - Experimental [remote functions](https://svelte.dev/docs/kit/remote-functions) for mutations (where applicable).
- [PostgreSQL](https://www.postgresql.org/)
- [Drizzle ORM](https://orm.drizzle.team/)
- [Cloudflare R2](https://www.cloudflare.com/developer-platform/products/r2/) + [Cloudflare Images](https://www.cloudflare.com/developer-platform/products/cloudflare-images/)
- [Tailwind CSS](https://tailwindcss.com/)
- Docker (currently production only)

No cloud services beyond Cloudflare are used. The server and database are as of 2025-12-15 hosted on a VPS provided by Linköping University's computer association [Lysator](https://www.lysator.liu.se/).

## Development

### Prequisites

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

The rest of the fields are not necessary for core functionality and can be left as default.

> [!NOTE]
> Account logins and team logos (both load and upload) will be unavailable when left empty.

Then run the following commands:

```bash
pnpm install
pnpm db:push
pnpm dev
```

Open up http://localhost:5173/setup in a browser, where the website will ask you to create a "superadmin" user. This user is the only one who can promote other admins.

> [!TIP]
> Currently, only Battlenet authentication is supported. This has implications if you lose the session credentials to the superuser. In that case, you'll either have to manually edit the database, or make sure you signed up with a Battletag you have access to (and [setup Battlenet OAuth]()).

### Next steps

- [Cloud services (full setup)](./cloud-services.md)
- [Database documentation](./database.md)


