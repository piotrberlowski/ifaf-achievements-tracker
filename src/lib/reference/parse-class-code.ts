import { ageDivisions, bowStyles, genders } from "./catalog.ts";

const divisionsLongestFirst = [...ageDivisions].sort(
  (left, right) => right.code.length - left.code.length,
);

export type ParsedClassCode = {
  code: string;
  ageDivisionCode: string;
  ageDivisionName: string;
  gender: "male" | "female";
  bowStyleCode: string;
  bowStyleName: string;
};

export function parseClassCode(input: string): ParsedClassCode | null {
  const trimmed = input.trim().toUpperCase();
  const archivedTraditional = trimmed.endsWith("(IFAF)");
  const code = trimmed.replace(/\s*\(IFAF\)$/, "");
  const division = divisionsLongestFirst.find((candidate) =>
    code.startsWith(candidate.code),
  );
  if (!division) {
    return null;
  }

  const rest = code.slice(division.code.length);
  const gender = genders.find((candidate) => candidate.code === rest[0]);
  if (!gender) {
    return null;
  }

  const bowStyleCode = rest.slice(1);
  const writtenStyle = bowStyles.find((candidate) => candidate.code === bowStyleCode);
  const style =
    archivedTraditional && writtenStyle?.code === "TR"
      ? bowStyles.find((candidate) => candidate.code === "TR_ARCHIVED")
      : writtenStyle;
  if (!style || (archivedTraditional && writtenStyle?.code !== "TR")) {
    return null;
  }

  return {
    code: archivedTraditional ? `${code}(IFAF)` : code,
    ageDivisionCode: division.code,
    ageDivisionName: division.name,
    gender: gender.value,
    bowStyleCode: style.code,
    bowStyleName: style.name,
  };
}
