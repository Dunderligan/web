# Hemsida

Dunderligans officiella webbplats, [dunderligan.se](https://dunderligan.se). **Work in progress!!**

Du hittar en testversion av hemsidan just nu på [dev.dunderligan.se](https://dev.dunderligan.se)!

## Nördigheter

Projektet använder [SvelteKit](https://svelte.dev/) för frontend och backend, [PostgreSQL](https://www.postgresql.org/) för databas och [Drizzle ORM](https://orm.drizzle.team/) för att kommunicera med den. För bilder och andra mediefiler används Cloudflares [R2](https://www.cloudflare.com/developer-platform/products/r2/) med [Images](https://www.cloudflare.com/developer-platform/products/cloudflare-images/) framför.

Förutom de två används inga molntjänster, utan hemsidan driftas i en Docker container på hårdvara från Linköping Universitets datorförening [Lysator](https://www.lysator.liu.se/).

## Dokumentation

Utförlig dokumentation finns tillgänglig för olika delar av projektet:

- **[ARCHITECTURE.md](ARCHITECTURE.md)** - Översikt över systemarkitektur, teknologier och designbeslut
- **[DATABASE.md](DATABASE.md)** - Databasschema, relationer och frågemönster
- **[API.md](API.md)** - Remote functions API och autentisering
- **[COMPONENTS.md](COMPONENTS.md)** - Komponentbibliotek och användning
- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Deployment-guide och produktionsinställningar
- **[CONTRIBUTING.md](CONTRIBUTING.md)** - Riktlinjer för att bidra till projektet
- **[TROUBLESHOOTING.md](TROUBLESHOOTING.md)** - Felsökningsguide för vanliga problem

## Utveckling

För att köra hemsidan lokalt behövder du ha [NodeJS](https://nodejs.org/en) och [pnpm](https://pnpm.io/) installerade.

Du behöver dessutom en databas att koppla emot. Det absolut enklaste är att installera PostgreSQL lokalt, vilket du hittar nedladdningar för på [den officiella hemsidan](https://www.postgresql.org/download/).

Kopiera sedan `.env.example` till `.env` och fyll i `DATABASE_URL`-fältet med URL:en för din databas, exempelvis:

```env
DATABASE_URL="postgresql://user:password@localhost/dunderligan"
```

De övriga fälten är inte nödvändiga för kärnfunktionalitet och kan lämnas blanka.

Kör sedan följande kommandon:

```bash
pnpm install
pnpm db:push
pnpm dev
```

Öppna http://localhost:5173/setup i din webbläsare för att göra klart installationen.

Vid senare uppstart kan du lägga till argumentet `--open` för att automatiskt öppna upp sidan.

### Seeding

Medan man ut utvecklar kan det vara användbart att ha testdata att leka runt med. I projektet finns en funktion för att slumpmässigt generera en säsong med lag, matcher, spelare, o.s.v.

För att komma igång, stäng ner dev-servern och starta upp den igen med `--seed` argumentet:

```bash
pnpm dev -- -- --seed
```

> [!CAUTION]
> `--seed` rensar den nuvarande databasen. Använd den **inte** på data du bryr dig om!

Gå sedan till någon sida på `localhost:5173` och vänta i några sekunder.

### Mer om databasen

Efter att du gjort ändringar i databas-schemat (`src/lib/server/db/schema`), kör `pnpm db:push` för att synka ändringarina med din lokala databas.
När du känner dig redo att committa ändringarna, kör `pnpm db:generate` för att generera en SQL-fil som kommer köras mot produktionsdatabasen (se `db.ts`).

De flesta datahämtingarna görs via drizzles relations-API och den bör användas i varje fall där det är möjligt. Muteringar görs via SvelteKits (experimentella) [remote functions](https://svelte.dev/docs/kit/remote-functions), som du hittar i `src/lib/remote`.

## Kontakt

Hemsidan utvecklas huvudsakligen av Bobbo, som du kan hitta på Discord (användarnamn `kesomannen`). För buggrapporteringar och förslag kan du även skapa en Issue här på Github-sidan.

## Licens

Källkoden är licenserad enligt [GNU GPLv3](https://choosealicense.com/licenses/gpl-3.0/#). Kortfattat innebär det att vem som helst får kopiera, modifiera och sprida koden, med haken att alla derivat måste släppas under samma licens.
