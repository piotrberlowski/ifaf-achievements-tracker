export const PERMISSIONS = [
  {
    id: "system.admin",
    label: "System administrator",
    description: "Grant and revoke every permission, including this one.",
  },
  {
    id: "claims.approve",
    label: "Approve membership claims",
    description: "Approve or reject a request to attach a sign-in to a membership number.",
  },
  {
    id: "names.approve",
    label: "Approve name changes",
    description: "Approve a new official name on a membership number.",
  },
  {
    id: "submissions.approve",
    label: "Review submissions",
    description: "Upload, modify, approve, and amend tournament submissions.",
  },
  {
    id: "integrations.manage",
    label: "Manage app credentials",
    description: "Issue and revoke a competition app’s credential.",
  },
] as const;

export type PermissionId = (typeof PERMISSIONS)[number]["id"];

const permissionIds = new Set<string>(PERMISSIONS.map((permission) => permission.id));

export function isPermissionId(value: string): value is PermissionId {
  return permissionIds.has(value);
}

export function systemAdminEmails() {
  return (process.env.SYSTEM_ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function isBootstrappedAdmin(email?: string | null) {
  if (!email) {
    return false;
  }
  return systemAdminEmails().includes(email.toLowerCase());
}
