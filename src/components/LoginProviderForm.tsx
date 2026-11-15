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
      action={async () => {
        await authClient.signIn.social({
          provider: providerId,
          callbackURL: params.get("callbackUrl") || "/",
        });
      }}
    >
      <button className="btn btn-ghost btn-sm" type="submit">
        Sign in with {providerName}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          alt=""
          height={24}
          src={`${PROVIDER_IMG_PATH}/${providerId}.svg`}
          width={24}
        />
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
    <div className="flex flex-col gap-2">
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
