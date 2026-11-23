import { randomUUID } from "node:crypto";
import { PinStatus } from "@prisma/client";
import type ExcelJS from "exceljs";
import { emptyBundle, registerPerson, type ImportBundle } from "./bundle.ts";
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
import { requiredId, requiredRound, type ReferenceMaps } from "./reference.ts";
import { parseIssuedPins } from "./tracker.ts";

const MEMBERSHIP = /^IRE_\d+$/i;

export async function parseGainsWorkbook(
  source: string | Buffer | ArrayBuffer,
  maps: ReferenceMaps,
  corrections: IdentityCorrection[],
): Promise<ImportBundle> {
  const workbook = await readWorkbook(source);
  const bundle = emptyBundle();
  const peopleByNumber = new Map<string, string>();
  const pinKeys = new Set<string>();

  for (const spec of gainsSheetSpecs) {
    const sheet = workbook.getWorksheet(spec.name);
    if (!sheet) {
      bundle.warnings.push({ sheet: spec.name, message: "sheet is missing" });
      continue;
    }
    parseGainsSheet({
      sheet,
      spec,
      maps,
      corrections,
      bundle,
      peopleByNumber,
      pinKeys,
    });
  }

  return bundle;
}

function parseGainsSheet(args: {
  sheet: ExcelJS.Worksheet;
  spec: (typeof gainsSheetSpecs)[number];
  maps: ReferenceMaps;
  corrections: IdentityCorrection[];
  bundle: ImportBundle;
  peopleByNumber: Map<string, string>;
  pinKeys: Set<string>;
}) {
  const { sheet, spec, maps, corrections, bundle, peopleByNumber, pinKeys } = args;
  const cols = columnCount(sheet);
  const rows = rowCount(sheet);
  const eventRow = findLabeledRow(sheet, "event");
  const dateRow = findLabeledRow(sheet, "date");
  const roundRow = findLabeledRow(sheet, "round");
  const trackerCol = findTrackerColumn(sheet, cols);

  if (!eventRow || !dateRow || !roundRow) {
    bundle.warnings.push({
      sheet: spec.name,
      message: "could not find Event, Date, and Round header rows",
    });
    return;
  }

  type CompCol = { column: number; competitionId: string; submissionId: string };
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
    const round = requiredRound(maps, roundCode);
    const eventName = cellText(sheet.getRow(eventRow).getCell(column)) || "Imported competition";
    const when = parseShotWhen(cellScalar(sheet.getRow(dateRow).getCell(column)));
    const competitionId = randomUUID();
    const submissionId = randomUUID();
    bundle.competitions.push({
      id: competitionId,
      name: eventName,
      startsOn: when.startsOn,
      roundCode: round.code,
      roundId: round.id,
      countsForGains: true,
    });
    bundle.submissions.push({
      id: submissionId,
      competitionId,
      status: "pending",
      source: "import",
      externalId: `gains:${spec.slug}:${columnLetters(column)}`,
    });
    competitionCols.push({ column, competitionId, submissionId });
  }

  const awardTrackId = requiredId(maps.awardTrackId, spec.awardTrackCode, "award track");

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
      bundle.warnings.push({
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
    const personId = registerPerson(
      bundle,
      peopleByNumber,
      membershipNumber,
      fullName,
      cleaned.note,
    );
    const bowStyleId = requiredId(maps.bowStyleId, parsedClass.bowStyleCode, "bow style");
    const ageDivisionId = requiredId(
      maps.ageDivisionId,
      parsedClass.ageDivisionCode,
      "age division",
    );

    for (const { column, competitionId, submissionId } of competitionCols) {
      const score = integerScore(cellScalar(row.getCell(column)) ?? cellNumber(row.getCell(column)));
      if (score == null) {
        continue;
      }
      const scoreId = randomUUID();
      bundle.scores.push({
        id: scoreId,
        personId,
        bowStyleId,
        ageDivisionId,
        gender: parsedClass.gender,
        competitionId,
        score,
      });
      bundle.entries.push({
        submissionId,
        membershipNumber,
        archerName: fullName,
        classCode: parsedClass.code,
        bowStyleId,
        ageDivisionId,
        gender: parsedClass.gender,
        score,
        scoreId,
      });
    }

    if (trackerCol) {
      for (const level of parseIssuedPins(cellText(row.getCell(trackerCol)))) {
        const key = [personId, bowStyleId, ageDivisionId, parsedClass.gender, awardTrackId, level].join(
          "|",
        );
        if (pinKeys.has(key)) {
          continue;
        }
        pinKeys.add(key);
        bundle.awards.push({
          personId,
          bowStyleId,
          ageDivisionId,
          gender: parsedClass.gender,
          awardTrackId,
          level,
          status: PinStatus.issued,
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
