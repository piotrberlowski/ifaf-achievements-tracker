import { ageDivisions, genders } from "../reference/catalog.ts";
import type { StandingRecord } from "../records/view-filter.ts";
import { gainsCutoffs } from "./cutoffs.ts";

export type GainsThresholdRow = {
  roundCode: string;
  roundName: string;
  ageDivisionCode: string;
  ageDivisionName: string;
  gender: StandingRecord["gender"];
  genderName: string;
  record: number;
  holderName: string;
  bronze: number;
  silver: number;
  gold: number;
  star: number;
};

export function standingThresholds(records: readonly StandingRecord[]): GainsThresholdRow[] {
  return records.map((record) => {
    const cutoffs = gainsCutoffs(record.score);
    return {
      roundCode: record.roundCode,
      roundName: record.roundName,
      ageDivisionCode: record.ageCode,
      ageDivisionName: ageDivisions.find((division) => division.code === record.ageCode)?.name ?? record.ageCode,
      gender: record.gender,
      genderName: genders.find((gender) => gender.value === record.gender)?.name ?? record.gender,
      record: record.score,
      holderName: record.holder,
      bronze: cutoffs.bronze,
      silver: cutoffs.silver,
      gold: cutoffs.gold,
      star: cutoffs.star,
    };
  });
}
