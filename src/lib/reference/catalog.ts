export const awardTracks = [
  { code: "INDOOR", name: "Indoor" },
  { code: "ANIMAL", name: "Animal" },
  { code: "FIELD", name: "Field" },
] as const;

export const bowStyles = [
  { code: "BB-R", name: "Barebow Recurve" },
  { code: "BB-C", name: "Barebow Compound" },
  { code: "FS-R", name: "Freestyle Limited Recurve" },
  { code: "FS-C", name: "Freestyle Limited Compound" },
  { code: "FU", name: "Freestyle Unlimited" },
  { code: "BH-R", name: "Bowhunter Recurve" },
  { code: "BH-C", name: "Bowhunter Compound" },
  { code: "BL", name: "Bowhunter Limited" },
  { code: "BU", name: "Bowhunter Unlimited" },
  { code: "LB", name: "Longbow" },
  { code: "HB", name: "Historical Bow" },
  { code: "TR", name: "Traditional Recurve" },
  { code: "TR_ARCHIVED", name: "Irish Traditional Recurve, archived" },
] as const;

export const ageDivisions = [
  { code: "C", name: "Cub" },
  { code: "J", name: "Junior" },
  { code: "YA", name: "Young Adult" },
  { code: "A", name: "Adult" },
  { code: "V", name: "Veteran" },
  { code: "S", name: "Senior" },
] as const;

export const genders = [
  { code: "M", name: "Male", value: "male" },
  { code: "F", name: "Female", value: "female" },
] as const;

export type AwardTrackCode = (typeof awardTracks)[number]["code"];
export type BowStyleCode = (typeof bowStyles)[number]["code"];
export type AgeDivisionCode = (typeof ageDivisions)[number]["code"];
export type GenderValue = (typeof genders)[number]["value"];

export const classCodes = ageDivisions.flatMap((division) =>
  genders.flatMap((gender) =>
    bowStyles.map((style) => ({
      code: `${division.code}${gender.code}${style.code}`,
      ageDivisionCode: division.code,
      gender: gender.value,
      bowStyleCode: style.code,
    })),
  ),
);

export const rounds = [
  { code: "FLINT", name: "Flint", awardTrackCode: "INDOOR", displayOnly: false },
  { code: "INDOOR", name: "IFAA Indoor", awardTrackCode: "INDOOR", displayOnly: false },
  { code: "SBG", name: "Standard Big Game", awardTrackCode: "ANIMAL", displayOnly: false },
  {
    code: "SBG_ARCHIVED",
    name: "SBG old format, display only",
    awardTrackCode: "ANIMAL",
    displayOnly: true,
  },
  { code: "UAR", name: "Unmarked animal", awardTrackCode: "ANIMAL", displayOnly: false },
  {
    code: "3D_STD",
    name: "3-D Standard, 2 arrows",
    awardTrackCode: "ANIMAL",
    displayOnly: false,
  },
  {
    code: "3D_HUNT",
    name: "3-D Hunting, 1 arrow",
    awardTrackCode: "ANIMAL",
    displayOnly: false,
  },
  { code: "FIELD", name: "Field", awardTrackCode: "FIELD", displayOnly: false },
  { code: "HUNTER", name: "Hunter", awardTrackCode: "FIELD", displayOnly: false },
  { code: "MAR", name: "Marked Animal", awardTrackCode: "FIELD", displayOnly: false },
  { code: "EXPERT", name: "Expert Field", awardTrackCode: "FIELD", displayOnly: false },
  { code: "INTL", name: "International", awardTrackCode: "FIELD", displayOnly: false },
] as const;
