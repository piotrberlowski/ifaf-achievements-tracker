import { AwardLevel } from "@prisma/client";

const PIN_TOKENS: Record<string, AwardLevel> = {
  BRONZE: AwardLevel.bronze,
  SILVER: AwardLevel.silver,
  GOLD: AwardLevel.gold,
  HOTSHOT: AwardLevel.hotshot,
  STAR: AwardLevel.star,
};

export function parseIssuedPins(cell: string | null | undefined): AwardLevel[] {
  if (!cell) {
    return [];
  }

  const withoutCounts = cell.replace(/\([^)]*\)/g, ",");
  const tokens = withoutCounts
    .split(/[,.]+/)
    .map((token) => token.trim())
    .filter(Boolean);

  const levels: AwardLevel[] = [];
  const seen = new Set<AwardLevel>();
  for (const token of tokens) {
    if (!/[A-Z]/.test(token)) {
      continue;
    }
    const level = PIN_TOKENS[token.toUpperCase()];
    if (!level || seen.has(level)) {
      continue;
    }
    seen.add(level);
    levels.push(level);
  }
  return levels;
}
