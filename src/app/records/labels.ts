import type { AgeDivisionCode, AwardTrackCode, BowStyleCode, GenderValue } from "@/lib/reference/catalog";
import { ageDivisions, awardTracks, bowStyles, genders } from "@/lib/reference/catalog";
import { allAges, type RecordView } from "@/lib/records/view-filter";

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

export function standingSummary(view: RecordView, count: number): string {
  const countLabel = count === 1 ? "1 standing record" : `${count} standing records`;
  const ageLabel =
    view.ages.length === allAges.length
      ? "all ages"
      : view.ages.map((age) => ageDivisionName(age)).join(", ");
  const genderText = view.genders.length === 1 ? genderLabel(view.genders[0]) : "all genders";
  return `${countLabel} · ${ageLabel} · ${genderText}`;
}
