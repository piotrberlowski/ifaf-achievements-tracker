# IFAF achievements tracker

Records and GAINS awards for members of the Irish Field Archery Federation.

## Local development

```bash
pnpm install
```

Copy `.env.example` to `.env.local`. The database URLs in that file point at the local development database. See [Database development](#database-development).

Production is [https://gains.fieldarchery.app](https://gains.fieldarchery.app) and [https://records.fieldarchery.app](https://records.fieldarchery.app). Staging is [https://gains-staging.fieldarchery.app](https://gains-staging.fieldarchery.app). Set `BETTER_AUTH_URL` to the gains host in production, to `https://gains-staging.fieldarchery.app` on staging, and to `http://localhost:3000` locally.

Google and Auth0 need a callback for each host:

- `http://localhost:3000/api/auth/callback/google`
- `https://gains.fieldarchery.app/api/auth/callback/google`
- `https://records.fieldarchery.app/api/auth/callback/google`
- `https://gains-staging.fieldarchery.app/api/auth/callback/google`
- `http://localhost:3000/api/auth/callback/auth0`
- `https://gains.fieldarchery.app/api/auth/callback/auth0`
- `https://records.fieldarchery.app/api/auth/callback/auth0`
- `https://gains-staging.fieldarchery.app/api/auth/callback/auth0`

Auth0 also needs these Allowed Logout URLs, so sign-out can return to the host the user was on:

- `http://localhost:3000/`
- `https://gains.fieldarchery.app/`
- `https://records.fieldarchery.app/`
- `https://gains-staging.fieldarchery.app/`

Application Login URI is `https://gains.fieldarchery.app/login` in production and `http://localhost:3000/login` locally. Auth0 allows one. Staging sign-in starts at `https://gains-staging.fieldarchery.app/login`.

```bash
pnpm dev
```

`GET /api/health` checks the database.

## Database development

Creating, applying, and resetting the schema are Prisma commands. `psql`, `dropdb`, and `createdb` are outside this workflow.

Point `IFAF_AT_POSTGRES_PRISMA_URL` and `IFAF_AT_POSTGRES_URL_NON_POOLING` in `.env.local` at the local development database. On a local Postgres server the two URLs are the same string. Prisma Migrate uses the direct URL. The app uses the pooled URL. Hosted environments set the same names to the Neon pooled and direct URLs.

Prisma reads `.env` and does not read `.env.local`. Load the local file with dotenv. `--override` applies `.env.local` when the shell already has database URLs. Pass `.env.local` for this work. `.env.production.local` is the hosted database.

```bash
pnpm exec dotenv -e .env.local --override -- prisma migrate dev
pnpm exec dotenv -e .env.local --override -- prisma migrate reset
pnpm exec dotenv -e .env.local --override -- prisma migrate status
pnpm exec dotenv -e .env.local --override -- prisma migrate deploy
```

Those four commands are also:

```bash
pnpm db:migrate
pnpm db:reset
pnpm db:status
pnpm db:deploy
```

`pnpm db:migrate` runs `prisma migrate dev`. It writes a migration from `prisma/schema.prisma`, replays the migration history on a shadow database, and applies it to the local database. Name the migration with `pnpm db:migrate -- --name domain`.

`pnpm db:reset` runs `prisma migrate reset`. It drops the local database, creates it again, and applies every migration. Prisma asks for confirmation. In a non-interactive shell, run `pnpm db:reset -- --force`.

`pnpm db:deploy` runs `prisma migrate deploy` and applies migrations that are already written. A hosted deploy runs that command with `IFAF_AT_POSTGRES_URL_NON_POOLING` already in the environment.

`migrate dev` needs a local Postgres server that can create a shadow database next to the development database.
