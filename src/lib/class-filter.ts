import {
  ageDivisions,
  awardTracks,
  bowStyles,
  genders,
} from "./reference/catalog.ts";

export type AwardTrackCode = (typeof awardTracks)[number]["code"];
export type BowStyleCode = (typeof bowStyles)[number]["code"];
export type AgeDivisionCode = (typeof ageDivisions)[number]["code"];
export type GenderValue = (typeof genders)[number]["value"];

export type ClassFilterValue = {
  discipline: AwardTrackCode | null;
  bows: BowStyleCode[];
  ages: AgeDivisionCode[];
  gender: GenderValue | null;
};

export function disciplineName(code: AwardTrackCode): string {
  return awardTracks.find((track) => track.code === code)?.name ?? code;
}

export function bowCategoryName(code: BowStyleCode): string {
  return bowStyles.find((style) => style.code === code)?.name ?? code;
}

export function ageDivisionName(code: AgeDivisionCode): string {
  return ageDivisions.find((division) => division.code === code)?.name ?? code;
}

export function genderLabel(value: GenderValue): string {
  return genders.find((gender) => gender.value === value)?.name ?? value;
}

export function genderCode(value: GenderValue): string {
  return genders.find((gender) => gender.value === value)?.code ?? value;
}

export function summary(filter: ClassFilterValue, count: number): string {
  const countLabel = count === 1 ? "1 standing record" : `${count} standing records`;
  const ageLabel =
    filter.ages.length > 0 ? filter.ages.map((age) => ageDivisionName(age)).join(", ") : "all ages";
  const genderText = filter.gender ? genderLabel(filter.gender) : "all genders";
  return `${countLabel} · ${ageLabel} · ${genderText}`;
}
