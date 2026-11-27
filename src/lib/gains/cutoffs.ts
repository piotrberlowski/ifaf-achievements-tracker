export const gainsBands = [
  { level: "bronze", label: "Bronze", percent: 50 },
  { level: "silver", label: "Silver", percent: 70 },
  { level: "gold", label: "Gold", percent: 80 },
  { level: "star", label: "Star", percent: 90 },
] as const;

export type GainsBandLevel = (typeof gainsBands)[number]["level"];

export function scoreCutoff(record: number, percent: number): number {
  if (!Number.isInteger(record) || record < 0) {
    throw new Error("A record score is a whole number of zero or more");
  }
  if (!Number.isInteger(percent) || percent < 0 || percent > 100) {
    throw new Error("A cutoff percent is a whole number from 0 to 100");
  }
  return Math.floor((record * percent + 99) / 100);
}

export function gainsCutoffs(record: number): Record<GainsBandLevel, number> {
  return {
    bronze: scoreCutoff(record, 50),
    silver: scoreCutoff(record, 70),
    gold: scoreCutoff(record, 80),
    star: scoreCutoff(record, 90),
  };
}
