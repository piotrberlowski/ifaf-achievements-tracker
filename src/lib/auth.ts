import { prismaAdapter } from "@better-auth/prisma-adapter";
import { betterAuth } from "better-auth";
import { auth0, genericOAuth } from "better-auth/plugins/generic-oauth";
import { getPrisma } from "@/lib/prisma";

function auth0Domain(issuer: string) {
  return issuer.replace(/^https?:\/\//, "").replace(/\/$/, "");
}

function createAuth() {
  const googleId = process.env.AUTH_GOOGLE_ID;
  const googleSecret = process.env.AUTH_GOOGLE_SECRET;
  const auth0Id = process.env.AUTH_AUTH0_ID;
  const auth0Secret = process.env.AUTH_AUTH0_SECRET;
  const auth0Issuer = process.env.AUTH_AUTH0_ISSUER;

  return betterAuth({
    database: prismaAdapter(getPrisma(), {
      provider: "postgresql",
    }),
    secret: process.env.BETTER_AUTH_SECRET,
    baseURL: process.env.BETTER_AUTH_URL,
    socialProviders:
      googleId && googleSecret
        ? {
            google: {
              clientId: googleId,
              clientSecret: googleSecret,
            },
          }
        : undefined,
    plugins:
      auth0Id && auth0Secret && auth0Issuer
        ? [
            genericOAuth({
              config: [
                auth0({
                  clientId: auth0Id,
                  clientSecret: auth0Secret,
                  domain: auth0Domain(auth0Issuer),
                }),
              ],
            }),
          ]
        : [],
  });
}

let auth: ReturnType<typeof createAuth> | undefined;

export function getAuth() {
  auth ??= createAuth();
  return auth;
}
