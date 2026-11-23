import type ExcelJS from "exceljs";
import { applyIdentityCorrection, type IdentityCorrection } from "./corrections.ts";
import {
  cellNumber,
  cellScalar,
  cellText,
  columnCount,
  integerScore,
  readWorkbook,
  rowCount,
} from "./cells.ts";
import { parseShotWhen } from "./dates.ts";
import { classParts, columnLetters, gainsSheetSpecs, roundCodeFromLabel } from "./labels.ts";
import { cleanArcherName } from "./names.ts";
import { parseIssuedPins } from "./tracker.ts";
import type {
  ImportCompetition,
  ImportPerson,
  ImportPin,
  ImportScore,
  ParseWarning,
} from "./types.ts";

const MEMBERSHIP = /^IRE_\d+$/i;

export type ParsedGains = {
  people: ImportPerson[];
  competitions: ImportCompetition[];
  scores: ImportScore[];
  pins: ImportPin[];
  warnings: ParseWarning[];
};

export async function parseGainsWorkbook(
  source: string | Buffer | ArrayBuffer,
  corrections: IdentityCorrection[],
): Promise<ParsedGains> {
  const workbook = await readWorkbook(source);
  const people = new Map<string, ImportPerson>();
  const competitions: ImportCompetition[] = [];
  const scores: ImportScore[] = [];
  const pinKeys = new Set<string>();
  const pins: ImportPin[] = [];
  const warnings: ParseWarning[] = [];

  for (const spec of gainsSheetSpecs) {
    const sheet = workbook.getWorksheet(spec.name);
    if (!sheet) {
      warnings.push({ sheet: spec.name, message: "sheet is missing" });
      continue;
    }
    parseGainsSheet({
      sheet,
      spec,
      corrections,
      people,
      competitions,
      scores,
      pins,
      pinKeys,
      warnings,
    });
  }

  return {
    people: [...people.values()],
    competitions,
    scores,
    pins,
    warnings,
  };
}

function parseGainsSheet(args: {
  sheet: ExcelJS.Worksheet;
  spec: (typeof gainsSheetSpecs)[number];
  corrections: IdentityCorrection[];
  people: Map<string, ImportPerson>;
  competitions: ImportCompetition[];
  scores: ImportScore[];
  pins: ImportPin[];
  pinKeys: Set<string>;
  warnings: ParseWarning[];
}) {
  const { sheet, spec, corrections, people, competitions, scores, pins, pinKeys, warnings } =
    args;
  const cols = columnCount(sheet);
  const rows = rowCount(sheet);
  const eventRow = findLabeledRow(sheet, "event");
  const dateRow = findLabeledRow(sheet, "date");
  const roundRow = findLabeledRow(sheet, "round");
  const trackerCol = findTrackerColumn(sheet, cols);

  if (!eventRow || !dateRow || !roundRow) {
    warnings.push({
      sheet: spec.name,
      message: "could not find Event, Date, and Round header rows",
    });
    return;
  }

  type CompCol = { column: number; competition: ImportCompetition };
  const competitionCols: CompCol[] = [];
  for (let column = 4; column <= cols; column += 1) {
    if (column === trackerCol) {
      continue;
    }
    const roundLabel = cellText(sheet.getRow(roundRow).getCell(column));
    const roundCode = roundCodeFromLabel(roundLabel);
    if (!roundCode) {
      continue;
    }
    const eventName = cellText(sheet.getRow(eventRow).getCell(column)) || "Imported competition";
    const when = parseShotWhen(cellScalar(sheet.getRow(dateRow).getCell(column)));
    const externalId = `gains:${spec.slug}:${columnLetters(column)}`;
    const competition: ImportCompetition = {
      externalId,
      name: eventName,
      startsOn: when.startsOn,
      roundCode,
      countsForGains: true,
    };
    competitions.push(competition);
    competitionCols.push({ column, competition });
  }

  for (let rowNumber = 1; rowNumber <= rows; rowNumber += 1) {
    const row = sheet.getRow(rowNumber);
    const membershipRaw = cellText(row.getCell(1));
    if (!MEMBERSHIP.test(membershipRaw)) {
      continue;
    }
    const archerName = cellText(row.getCell(2));
    const classCodeRaw = cellText(row.getCell(3));
    const parsedClass = classParts(classCodeRaw);
    if (!parsedClass) {
      warnings.push({
        sheet: spec.name,
        message: `unrecognised class ${classCodeRaw || "(empty)"} for ${membershipRaw}`,
      });
      continue;
    }

    const membershipNumber = applyIdentityCorrection(
      membershipRaw.toUpperCase(),
      archerName,
      corrections,
    );
    const cleaned = cleanArcherName(archerName);
    const fullName = cleaned.fullName || archerName;
    const existing = people.get(membershipNumber);
    if (!existing) {
      people.set(membershipNumber, {
        membershipNumber,
        names: [{ fullName, note: cleaned.note }],
      });
    } else if (!existing.names.some((name) => name.fullName === fullName)) {
      existing.names.push({ fullName, note: cleaned.note });
    }

    for (const { column, competition } of competitionCols) {
      const score = integerScore(cellScalar(row.getCell(column)) ?? cellNumber(row.getCell(column)));
      if (score == null) {
        continue;
      }
      scores.push({
        competitionExternalId: competition.externalId,
        membershipNumber,
        archerName: cleaned.fullName || archerName,
        classCode: parsedClass.code,
        bowStyleCode: parsedClass.bowStyleCode,
        ageDivisionCode: parsedClass.ageDivisionCode,
        gender: parsedClass.gender,
        score,
      });
    }

    if (trackerCol) {
      const issued = parseIssuedPins(cellText(row.getCell(trackerCol)));
      for (const level of issued) {
        const key = [
          membershipNumber,
          parsedClass.bowStyleCode,
          parsedClass.ageDivisionCode,
          parsedClass.gender,
          spec.awardTrackCode,
          level,
        ].join("|");
        if (pinKeys.has(key)) {
          continue;
        }
        pinKeys.add(key);
        pins.push({
          membershipNumber,
          classCode: parsedClass.code,
          bowStyleCode: parsedClass.bowStyleCode,
          ageDivisionCode: parsedClass.ageDivisionCode,
          gender: parsedClass.gender,
          awardTrackCode: spec.awardTrackCode,
          level,
        });
      }
    }
  }
}

function findLabeledRow(sheet: ExcelJS.Worksheet, label: string): number | null {
  for (let row = 1; row <= 8; row += 1) {
    if (cellText(sheet.getRow(row).getCell(3)).toLowerCase() === label) {
      return row;
    }
  }
  return null;
}

function findTrackerColumn(sheet: ExcelJS.Worksheet, cols: number): number | null {
  for (let row = 1; row <= 5; row += 1) {
    for (let column = 1; column <= cols; column += 1) {
      if (cellText(sheet.getRow(row).getCell(column)).toUpperCase().includes("TRACKER")) {
        return column;
      }
    }
  }
  return null;
}
