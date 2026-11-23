const WORKBOOK_MEMBERSHIP = /^IRE_(\d+)$/i;
const STORED_MEMBERSHIP = /^(\d+)$/;

export function membershipNumberFromSheet(raw: string): string | null {
  const text = raw.trim();
  const prefixed = WORKBOOK_MEMBERSHIP.exec(text);
  if (prefixed) {
    return prefixed[1];
  }
  const bare = STORED_MEMBERSHIP.exec(text);
  return bare ? bare[1] : null;
}
