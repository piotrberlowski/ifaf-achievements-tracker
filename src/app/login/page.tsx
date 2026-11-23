import LoginProviderForm from "@/components/LoginProviderForm";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Sign in",
};

export default function LoginPage() {
  const providers = [
    process.env.AUTH_GOOGLE_ID &&
      process.env.AUTH_GOOGLE_SECRET && { id: "google", name: "Google" },
    process.env.AUTH_AUTH0_ID &&
      process.env.AUTH_AUTH0_SECRET &&
      process.env.AUTH_AUTH0_ISSUER && { id: "auth0", name: "Auth0" },
  ].filter((provider) => !!provider);

  return (
    <div className="flex min-h-[calc(100dvh-5rem)] items-start justify-center px-4 py-12 sm:items-center sm:py-16">
      <section className="card w-full max-w-md border border-secondary-content/15 bg-secondary text-secondary-content shadow-xl">
        <div className="card-body gap-7 p-7 sm:p-9">
          <div className="text-center">
            <p className="whitespace-nowrap text-sm font-semibold tracking-[0.16em] text-secondary-content/70 uppercase">
              IFAF Achievements
            </p>
            <h1 className="mt-2 text-3xl font-bold">Sign in</h1>
          </div>
          <div>
            <Suspense>
              <LoginProviderForm providers={providers} />
            </Suspense>
          </div>
        </div>
      </section>
    </div>
  );
}
