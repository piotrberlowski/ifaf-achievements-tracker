import { setPermission } from "@/app/admin/actions";
import { getPrisma } from "@/lib/prisma";
import { PERMISSIONS, isBootstrappedAdmin } from "@/lib/permissions";
import { getSession } from "@/lib/session";
import Link from "next/link";

export default async function PermissionsPage() {
  const session = await getSession();
  if (!session) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold">Permissions</h1>
        <p className="mt-3">
          <Link className="link" href="/login?callbackUrl=/admin">
            Sign in
          </Link>{" "}
          to grant permissions.
        </p>
      </div>
    );
  }

  if (!isBootstrappedAdmin(session.user.email)) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold">Permissions</h1>
        <p className="mt-3">Your account cannot grant permissions.</p>
      </div>
    );
  }

  let users: {
    id: string;
    name: string;
    email: string;
    permissions: { permission: string }[];
  }[] = [];
  let databaseError = false;

  try {
    users = await getPrisma().user.findMany({
      orderBy: { email: "asc" },
      select: {
        id: true,
        name: true,
        email: true,
        permissions: { select: { permission: true } },
      },
    });
  } catch {
    databaseError = true;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Permissions</h1>
      <p className="mt-2 max-w-2xl text-sm">
        Grant each account only the permissions it needs. An email listed in
        the system administrator setting keeps that permission even if it is
        cleared here.
      </p>
      {databaseError ? (
        <p className="mt-4">
          The permission tables are not in the database yet. Apply the Prisma
          migration, then reload this page.
        </p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="table table-sm">
            <thead>
              <tr>
                <th>Account</th>
                {PERMISSIONS.map((permission) => (
                  <th key={permission.id}>{permission.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((user) => {
                const held = new Set(user.permissions.map((grant) => grant.permission));
                const bootstrapped = isBootstrappedAdmin(user.email);
                return (
                  <tr key={user.id}>
                    <td>
                      <div className="font-medium">{user.name}</div>
                      <div className="text-xs opacity-70">{user.email}</div>
                    </td>
                    {PERMISSIONS.map((permission) => {
                      const locked =
                        permission.id === "system.admin" && bootstrapped;
                      const checked = locked || held.has(permission.id);
                      return (
                        <td key={permission.id}>
                          <form action={setPermission}>
                            <input name="userId" type="hidden" value={user.id} />
                            <input
                              name="permission"
                              type="hidden"
                              value={permission.id}
                            />
                            <input
                              name="enabled"
                              type="hidden"
                              value={checked ? "false" : "true"}
                            />
                            <button
                              aria-pressed={checked}
                              className="btn btn-ghost btn-xs"
                              disabled={locked}
                              title={permission.description}
                              type="submit"
                            >
                              {checked ? "Granted" : "Grant"}
                            </button>
                          </form>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
          {users.length === 0 && (
            <p className="mt-3 text-sm">No accounts have signed in yet.</p>
          )}
        </div>
      )}
    </div>
  );
}
