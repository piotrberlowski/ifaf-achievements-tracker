import { cleanArcherName, namesMatch } from "./names.ts";

export type IdentityCorrection = {
  sourceMembershipNumber: string;
  sourceFullName: string;
  targetMembershipNumber: string;
  reason: string;
};

export function parseIdentityCorrectionsCsv(text: string): IdentityCorrection[] {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
  if (lines.length === 0) {
    return [];
  }

  const header = splitCsvLine(lines[0]).map((cell) => cell.trim());
  const sourceIndex = header.indexOf("sourceMembershipNumber");
  const nameIndex = header.indexOf("sourceFullName");
  const targetIndex = header.indexOf("targetMembershipNumber");
  const reasonIndex = header.indexOf("reason");
  if (sourceIndex < 0 || nameIndex < 0 || targetIndex < 0) {
    throw new Error("identity-corrections.csv is missing required columns");
  }

  return lines.slice(1).map((line) => {
    const cells = splitCsvLine(line);
    return {
      sourceMembershipNumber: cells[sourceIndex]?.trim() ?? "",
      sourceFullName: cells[nameIndex]?.trim() ?? "",
      targetMembershipNumber: cells[targetIndex]?.trim() ?? "",
      reason: (reasonIndex >= 0 ? cells[reasonIndex] : "")?.trim() ?? "",
    };
  });
}

export function applyIdentityCorrection(
  membershipNumber: string,
  fullName: string,
  corrections: IdentityCorrection[],
): string {
  const cleaned = cleanArcherName(fullName).fullName;
  for (const correction of corrections) {
    if (
      correction.sourceMembershipNumber === membershipNumber &&
      namesMatch(cleaned, correction.sourceFullName)
    ) {
      return correction.targetMembershipNumber;
    }
  }
  return membershipNumber;
}

function splitCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      cells.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  cells.push(current);
  return cells;
}
