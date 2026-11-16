import { headers } from "next/headers";
import { getAuth } from "@/lib/auth";
import { isBootstrappedAdmin } from "@/lib/permissions";

export async function getSession() {
  return getAuth().api.getSession({
    headers: await headers(),
  });
}

export async function isSystemAdmin() {
  const session = await getSession();
  return isBootstrappedAdmin(session?.user.email);
}
