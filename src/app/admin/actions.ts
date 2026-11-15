"use server";

import { revalidatePath } from "next/cache";
import { getPrisma } from "@/lib/prisma";
import { isPermissionId } from "@/lib/permissions";
import { getSession, isSystemAdmin } from "@/lib/session";

export async function setPermission(formData: FormData) {
  const session = await getSession();
  if (!session || !(await isSystemAdmin())) {
    throw new Error("You cannot grant permissions.");
  }

  const userId = String(formData.get("userId") ?? "");
  const permission = String(formData.get("permission") ?? "");
  const enabled = formData.get("enabled") === "true";

  if (!userId || !isPermissionId(permission)) {
    throw new Error("Unknown permission.");
  }

  const prisma = getPrisma();
  if (enabled) {
    await prisma.permissionGrant.upsert({
      where: { userId_permission: { userId, permission } },
      create: {
        id: crypto.randomUUID(),
        userId,
        permission,
        grantedBy: session.user.id,
      },
      update: { grantedBy: session.user.id },
    });
  } else {
    await prisma.permissionGrant.deleteMany({
      where: { userId, permission },
    });
  }

  revalidatePath("/admin");
}
