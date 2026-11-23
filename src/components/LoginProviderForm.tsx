"use client";

import { authClient } from "@/lib/auth-client";
import { useSearchParams } from "next/navigation";

const PROVIDER_IMG_PATH = "https://authjs.dev/img/providers";

function ProviderButton({
  providerId,
  providerName,
}: {
  providerId: string;
  providerName: string;
}) {
  const params = useSearchParams();

  return (
    <form
      className="w-full"
      action={async () => {
        await authClient.signIn.social({
          provider: providerId,
          callbackURL: params.get("callbackUrl") || "/",
        });
      }}
    >
      <button
        className="btn w-full gap-3 border-base-100 bg-base-100 text-base-content hover:border-accent hover:bg-accent hover:text-accent-content"
        type="submit"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          alt=""
          className="size-4 shrink-0"
          height={16}
          src={`${PROVIDER_IMG_PATH}/${providerId}.svg`}
          width={16}
        />
        <span>Sign in with {providerName}</span>
      </button>
    </form>
  );
}

export default function LoginProviderForm({
  providers,
}: {
  providers: { id: string; name: string }[];
}) {
  if (providers.length === 0) {
    return (
      <p className="text-sm">
        Google and Auth0 are not configured yet. Sign-in will appear here once
        those credentials are set.
      </p>
    );
  }

  return (
    <div className="flex w-full flex-col gap-3">
      {providers.map((provider) => (
        <ProviderButton
          key={provider.id}
          providerId={provider.id}
          providerName={provider.name}
        />
      ))}
    </div>
  );
}
