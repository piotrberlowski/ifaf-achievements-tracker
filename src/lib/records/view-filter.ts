import {
  ageDivisions,
  bowStyles,
  genders,
  type AgeDivisionCode,
  type AwardTrackCode,
  type BowStyleCode,
  type GenderValue,
} from "../reference/catalog.ts";
import type { CategoryFilterField, CategoryQuery, CategoryQueryOptions } from "../search/category-query.ts";

export type StandingRecord = {
  roundCode: string;
  roundName: string;
  awardTrackCode: AwardTrackCode;
  bowCode: BowStyleCode;
  ageCode: AgeDivisionCode;
  gender: GenderValue;
  score: number;
  effectiveOn: string | null;
  eventName: string;
  holder: string;
};

export type RecordView = {
  discipline: AwardTrackCode;
  bow: BowStyleCode;
  ages: AgeDivisionCode[];
  genders: GenderValue[];
};

export const allBows: readonly BowStyleCode[] = bowStyles.map((style) => style.code);
export const allAges: readonly AgeDivisionCode[] = ageDivisions.map((division) => division.code);
export const allGenders: readonly GenderValue[] = genders.map((gender) => gender.value);

export const standingFilterFields = [
  "discipline",
  "bow",
  "age",
  "gender",
] as const satisfies readonly CategoryFilterField[];

export const standingFilterQuery = { multiple: ["age", "gender"] } as const satisfies CategoryQueryOptions;

const bowCodes = new Set<string>(allBows);
const ageCodes = new Set<string>(allAges);

export function initialRecordView(input: {
  discipline: string | null;
  bow: string | null;
  ages: readonly string[];
  gender: GenderValue | null;
}): RecordView {
  return {
    discipline: asDiscipline(input.discipline),
    bow: asBow(input.bow),
    ages: chosen(input.ages, allAges, ageCodes),
    genders: input.gender ? [input.gender] : [...allGenders],
  };
}

export function narrowSelection<T extends string>(selected: readonly T[], code: T, all: readonly T[]): T[] {
  if (selected.length === all.length) return [code];
  if (!selected.includes(code)) return [...selected, code];
  if (selected.length === 1) return [...selected];
  return selected.filter((item) => item !== code);
}

export function recordIsVisible(record: StandingRecord, view: RecordView): boolean {
  if (record.awardTrackCode !== view.discipline) return false;
  if (record.bowCode !== view.bow) return false;
  if (!view.ages.includes(record.ageCode)) return false;
  return view.genders.includes(record.gender);
}

export function withStandingDefaults(parsed: CategoryQuery): CategoryQuery {
  if (parsed.errors.length > 0) return parsed;
  const bow = parsed.bow ?? allBows[0];
  return {
    ...parsed,
    discipline: parsed.discipline ?? "ANIMAL",
    bow,
    bows: parsed.bow ? parsed.bows : [bow],
    ages: parsed.ages.length === allAges.length ? [] : parsed.ages,
  };
}

export function groupStandingsByRound<T extends { roundCode: string; roundName: string }>(
  records: readonly T[],
): { roundCode: string; roundName: string; records: T[] }[] {
  const groups: { roundCode: string; roundName: string; records: T[] }[] = [];
  for (const record of records) {
    const current = groups[groups.length - 1];
    if (!current || current.roundCode !== record.roundCode) {
      groups.push({
        roundCode: record.roundCode,
        roundName: record.roundName,
        records: [record],
      });
      continue;
    }
    current.records.push(record);
  }
  return groups;
}

function asBow(value: string | null): BowStyleCode {
  if (value && bowCodes.has(value)) return value as BowStyleCode;
  return allBows[0];
}

function asDiscipline(value: string | null): AwardTrackCode {
  if (value === "INDOOR" || value === "ANIMAL" || value === "FIELD") return value;
  return "ANIMAL";
}

function chosen<T extends string>(values: readonly string[], all: readonly T[], allowed: ReadonlySet<string>): T[] {
  const picked = values.filter((value): value is T => allowed.has(value));
  return picked.length > 0 ? picked : [...all];
}
