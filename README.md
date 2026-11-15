# IFAF achievements tracker

Records and GAINS awards for members of the Irish Field Archery Federation.

## Local development

```bash
pnpm install
```

Copy `.env.example` to `.env.local` and fill in the database URLs. On Vercel those values are `IFAF_AT_POSTGRES_PRISMA_URL` and `IFAF_AT_POSTGRES_URL_NON_POOLING`.

Google and Auth0 are optional until sign-in is exercised. The redirect URLs are `{BETTER_AUTH_URL}/api/auth/callback/google` and `{BETTER_AUTH_URL}/api/auth/callback/auth0`.

```bash
pnpm dev
```

`GET /api/health` checks the database.
