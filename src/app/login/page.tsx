import LoginProviderForm from "@/components/LoginProviderForm";
import { Suspense } from "react";

export default function LoginPage() {
  const providers = [
    process.env.AUTH_GOOGLE_ID &&
      process.env.AUTH_GOOGLE_SECRET && { id: "google", name: "Google" },
    process.env.AUTH_AUTH0_ID &&
      process.env.AUTH_AUTH0_SECRET &&
      process.env.AUTH_AUTH0_ISSUER && { id: "auth0", name: "Auth0" },
  ].filter((provider) => !!provider);

  return (
    <div className="hero h-full bg-base-100">
      <div className="hero-content flex-col rounded-lg bg-neutral lg:flex-row-reverse">
        <div className="text-center text-neutral-content lg:text-left">
          <h1 className="text-3xl font-bold xl:text-4xl">IFAF achievements</h1>
          <div className="my-3 flex flex-col gap-3">
            <p>
              Records and GAINS awards for the Irish Field Archery Federation.
            </p>
            <p>Sign in to claim a membership number or to administer the system.</p>
            <p>
              To use a <span className="font-bold">username and password</span>,
              choose Auth0.
            </p>
          </div>
        </div>
        <div className="card w-full max-w-sm shrink-0 bg-base-100 text-primary-content shadow-2xl">
          <div className="card-body">
            <Suspense>
              <LoginProviderForm providers={providers} />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}
