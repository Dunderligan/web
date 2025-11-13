# Hemsida

Dunderligans officiella webbplats, [dunderligan.se](https://dunderligan.se). **Work in progress!!**

## Nördigheter

Projektet använder [SvelteKit](https://svelte.dev/) för frontend och backend, [PostgreSQL](https://www.postgresql.org/) för databas och [Drizzle ORM](https://orm.drizzle.team/) för att kommunicera med den. För bilder och andra mediefiler används Cloudflares [R2](https://www.cloudflare.com/developer-platform/products/r2/) med [Images](https://www.cloudflare.com/developer-platform/products/cloudflare-images/) framför.

Förutom de två används inga andra molntjänster, utan hemsidan (ska förhoppningvis) driftas på hårdvara från Linköping Universitets datorförening [Lysator](https://www.lysator.liu.se/).

## Utveckling

För att köra hemsidan lokalt behövder du ha [NodeJS](https://nodejs.org/en) och [pnpm](https://pnpm.io/) installerade.

Du behöver dessutom en databas att koppla emot. Enklast är att installera PostgreSQL lokalt, vilket du hittar nedladdningar för på [den officiella hemsidan](https://www.postgresql.org/download/).

Kopiera sedan `.env.example` till `.env` och fyll i `DATABASE_URL`-fältet med URL:en för din databas, exempelvis:

```env
DATABASE_URL="postgresql://user:password@localhost/dunderligan"
```

De övriga fälten är inte nödvändiga för kärnfunktionalitet och kan lämnas blanka.

Kör sedan följande kommandon för att installera dependencies, sätta upp databasen, samt starta en dev-session och öppna den i din webbläsare:

```bash
pnpm install
pnpm db:push
pnpm dev --open
```

## Kontakt

Hemsidan utvecklas huvudsakligen av Bobbo, som du kan hitta på Discord (användarnamn `kesomannen`). För buggrapporteringar och förslag kan du även skapa en Issue här på Github-sidan.

## Licens

Källkoden är licenserad enligt [GNU GPLv3](https://choosealicense.com/licenses/gpl-3.0/#). Kortfattat innebär det att vem som helst får kopiera, modifiera och sprida koden, med haken att alla derivat måste släppas under samma licens.
