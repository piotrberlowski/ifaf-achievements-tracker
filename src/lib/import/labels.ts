import { DivisionGender } from "@prisma/client";
import { parseClassCode } from "../reference/parse-class-code.ts";

export const gainsSheetSpecs = [
  { name: "Gains Indoor", slug: "indoor", awardTrackCode: "INDOOR" },
  { name: "Gains Field Rounds", slug: "field", awardTrackCode: "FIELD" },
  { name: "Gains BowHunter Rounds", slug: "bowhunter", awardTrackCode: "ANIMAL" },
  { name: "Gains SBG Round", slug: "sbg", awardTrackCode: "ANIMAL" },
] as const;

const ROUND_LABELS: Record<string, string> = {
  flint: "FLINT",
  indoor: "INDOOR",
  "ifaa indoor round": "INDOOR",
  "ifaa flint round indoor/outdoor": "FLINT",
  sbg: "SBG",
  "sbg archived old format": "SBG_ARCHIVED",
  uar: "UAR",
  "3d std": "3D_STD",
  "ifaa 3-d standard round (2 arrows)": "3D_STD",
  "3d hunting": "3D_HUNT",
  "ifaa 3-d hunting round (1 arrow)": "3D_HUNT",
  field: "FIELD",
  "field round": "FIELD",
  hunter: "HUNTER",
  "hunter round": "HUNTER",
  "marked animal": "MAR",
  mar: "MAR",
  "expert field round": "EXPERT",
  expert: "EXPERT",
  "international round": "INTL",
  international: "INTL",
};

const STYLE_LABELS: Record<string, string> = {
  "barebow recurve": "BB-R",
  "barebow compound": "BB-C",
  "freestyle limited recurve": "FS-R",
  "freestyle limited compound": "FS-C",
  "freestyle unlimited": "FU",
  "bowhunter recurve": "BH-R",
  "bowhunter compound": "BH-C",
  "bowhunter limited": "BL",
  "bowhunter unlimited": "BU",
  longbow: "LB",
  "historical bow": "HB",
  "traditional recurve": "TR",
  "traditional recurve bow": "TR",
  "irish-traditional (ifaf style only)": "TR_ARCHIVED",
};

const AGE_LABELS: Record<string, string> = {
  cub: "C",
  junior: "J",
  "young adult": "YA",
  adult: "A",
  veteran: "V",
  senior: "S",
};

const DIVISION_RE =
  /^(Senior|Veteran|Adult|Young Adult|Junior|Cub)\s*\(\s*(M|F)\s*\)\s*$/i;

export function normalizeLabel(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

export function roundCodeFromLabel(value: string): string | null {
  return ROUND_LABELS[normalizeLabel(value)] ?? null;
}

export function bowStyleCodeFromLabel(value: string): string | null {
  return STYLE_LABELS[normalizeLabel(value)] ?? null;
}

export function parseDivisionLabel(
  value: string,
): { ageDivisionCode: string; gender: DivisionGender } | null {
  const match = DIVISION_RE.exec(value.trim());
  if (!match) {
    return null;
  }
  const ageDivisionCode = AGE_LABELS[match[1].toLowerCase()];
  if (!ageDivisionCode) {
    return null;
  }
  return {
    ageDivisionCode,
    gender: match[2].toUpperCase() === "F" ? DivisionGender.female : DivisionGender.male,
  };
}

export function classParts(classCode: string) {
  return parseClassCode(classCode);
}

export function columnLetters(index: number): string {
  let n = index;
  let letters = "";
  while (n > 0) {
    const rem = (n - 1) % 26;
    letters = String.fromCharCode(65 + rem) + letters;
    n = Math.floor((n - 1) / 26);
  }
  return letters;
}
