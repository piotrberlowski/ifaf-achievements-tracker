"use client";

import { authClient } from "@/lib/auth-client";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Account({
  name,
  isAdmin,
}: {
  name?: string | null;
  isAdmin: boolean;
}) {
  const router = useRouter();

  return (
    <div className="dropdown dropdown-end">
      <div tabIndex={0} role="button" className="btn btn-ghost btn-sm">
        {name || "Unauthenticated"}
      </div>
      <ul
        tabIndex={0}
        className="menu menu-sm dropdown-content z-1 mt-3 w-52 rounded-box bg-base-200 shadow"
      >
        {isAdmin && (
          <li className="w-full p-0">
            <Link className="btn btn-ghost btn-neutral btn-sm" href="/admin">
              Permissions
            </Link>
          </li>
        )}
        <li className="w-full p-0">
          <button
            className="btn btn-ghost btn-neutral btn-sm"
            onClick={() => {
              authClient
                .signOut({
                  callbackURL: `${window.location.origin}/`,
                })
                .then(() => router.refresh())
                .catch((error: unknown) => {
                  console.error("Failed to sign out:", error);
                });
            }}
            type="button"
          >
            Sign Out
          </button>
        </li>
      </ul>
    </div>
  );
}
