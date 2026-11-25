import type { RecordStanding } from "@prisma/client";
import { getPrisma } from "../prisma.ts";
import {
  rounds,
  type AgeDivisionCode,
  type AwardTrackCode,
  type BowStyleCode,
  type GenderValue,
} from "../reference/catalog.ts";
import { allAges, allBows, type StandingRecord } from "./view-filter.ts";

const roundOrder = new Map<string, number>(rounds.map((round, index) => [round.code, index]));
const bowCodes = new Set<string>(allBows);
const ageCodes = new Set<string>(allAges);
const disciplines = new Set<string>(["INDOOR", "ANIMAL", "FIELD"]);

export async function listStandingRecords(): Promise<StandingRecord[]> {
  const rows = await getPrisma().recordStanding.findMany({ where: { displayOnly: false } });
  return rows
    .flatMap((row) => {
      const standing = toStanding(row);
      return standing ? [standing] : [];
    })
    .sort((left, right) => (roundOrder.get(left.roundCode) ?? 0) - (roundOrder.get(right.roundCode) ?? 0));
}

function toStanding(row: RecordStanding): StandingRecord | null {
  const discipline = asDiscipline(row.awardTrackCode);
  const bow = asBow(row.bowCode);
  const age = asAge(row.ageCode);
  const gender = asGender(row.gender);
  if (!discipline || !bow || !age || !gender) return null;
  return {
    roundCode: row.roundCode,
    roundName: row.roundName,
    awardTrackCode: discipline,
    bowCode: bow,
    ageCode: age,
    gender,
    score: row.score,
    effectiveOn: row.effectiveOn ? row.effectiveOn.toISOString() : null,
    eventName: row.eventName,
    holder: row.holder,
  };
}

function asDiscipline(code: string): AwardTrackCode | null {
  return disciplines.has(code) ? (code as AwardTrackCode) : null;
}

function asBow(code: string): BowStyleCode | null {
  return bowCodes.has(code) ? (code as BowStyleCode) : null;
}

function asAge(code: string): AgeDivisionCode | null {
  return ageCodes.has(code) ? (code as AgeDivisionCode) : null;
}

function asGender(gender: RecordStanding["gender"]): GenderValue | null {
  if (gender === "male" || gender === "female") return gender;
  return null;
}
