# IFAF achievements tracker

Records and GAINS awards for members of the Irish Field Archery Federation.

## Local development

```bash
pnpm install
```

Copy `.env.example` to `.env.local` and fill in the database URLs. On Vercel those values are `IFAF_AT_POSTGRES_PRISMA_URL` and `IFAF_AT_POSTGRES_URL_NON_POOLING`.

Production is [https://gains.fieldarchery.app](https://gains.fieldarchery.app) and [https://records.fieldarchery.app](https://records.fieldarchery.app). Set `BETTER_AUTH_URL` to `https://gains.fieldarchery.app` there, and to `http://localhost:3000` locally.

Google and Auth0 need a callback for each host:

- `http://localhost:3000/api/auth/callback/google`
- `https://gains.fieldarchery.app/api/auth/callback/google`
- `https://records.fieldarchery.app/api/auth/callback/google`
- `http://localhost:3000/api/auth/callback/auth0`
- `https://gains.fieldarchery.app/api/auth/callback/auth0`
- `https://records.fieldarchery.app/api/auth/callback/auth0`

Auth0 also needs these Allowed Logout URLs, so sign-out can return to the host the user was on:

- `http://localhost:3000/`
- `https://gains.fieldarchery.app/`
- `https://records.fieldarchery.app/`

Application Login URI is `https://gains.fieldarchery.app/login` in production and `http://localhost:3000/login` locally. Auth0 allows one.

```bash
pnpm dev
```

`GET /api/health` checks the database.
