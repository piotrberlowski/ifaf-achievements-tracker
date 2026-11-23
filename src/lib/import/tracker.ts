export const pinLevels = ["bronze", "silver", "gold", "hotshot", "star"] as const;

export type PinLevel = (typeof pinLevels)[number];

const PIN_TOKENS = new Set<string>(["BRONZE", "SILVER", "GOLD", "HOTSHOT", "STAR"]);

export function parseIssuedPins(cell: string | null | undefined): PinLevel[] {
  if (!cell) {
    return [];
  }

  const withoutCounts = cell.replace(/\([^)]*\)/g, ",");
  const tokens = withoutCounts
    .split(/[,.]+/)
    .map((token) => token.trim())
    .filter(Boolean);

  const levels: PinLevel[] = [];
  const seen = new Set<string>();
  for (const token of tokens) {
    const upper = token.toUpperCase();
    if (!PIN_TOKENS.has(upper)) {
      continue;
    }
    if (!/[A-Z]/.test(token)) {
      continue;
    }
    if (seen.has(upper)) {
      continue;
    }
    seen.add(upper);
    levels.push(upper.toLowerCase() as PinLevel);
  }
  return levels;
}
