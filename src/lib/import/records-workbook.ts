import type ExcelJS from "exceljs";
import {
  cellScalar,
  cellText,
  columnCount,
  integerScore,
  readWorkbook,
  rowCount,
} from "./cells.ts";
import { parseShotWhen } from "./dates.ts";
import { bowStyleCodeFromLabel, parseDivisionLabel, roundCodeFromLabel } from "./labels.ts";
import type { ParseWarning, StandingRecord } from "./types.ts";

const RECORD_SHEETS = ["Animal rounds", "Indoor rounds", "Target Face Outdoor"] as const;

export type ParsedRecords = {
  records: StandingRecord[];
  warnings: ParseWarning[];
};

export async function parseRecordsWorkbook(
  source: string | Buffer | ArrayBuffer,
): Promise<ParsedRecords> {
  const workbook = await readWorkbook(source);
  const records: StandingRecord[] = [];
  const warnings: ParseWarning[] = [];

  for (const name of RECORD_SHEETS) {
    const sheet = workbook.getWorksheet(name);
    if (!sheet) {
      warnings.push({ sheet: name, message: "sheet is missing" });
      continue;
    }
    parseRecordsSheet(sheet, name, records, warnings);
  }

  return { records, warnings };
}

function parseRecordsSheet(
  sheet: ExcelJS.Worksheet,
  sheetName: string,
  records: StandingRecord[],
  warnings: ParseWarning[],
) {
  const cols = columnCount(sheet);
  const rows = rowCount(sheet);
  const nameCols: number[] = [];
  for (let column = 1; column <= cols; column += 1) {
    if (cellText(sheet.getRow(2).getCell(column)).toLowerCase() === "name") {
      nameCols.push(column);
    }
  }

  for (const nameCol of nameCols) {
    const roundLabel = headingToTheLeft(sheet, 1, nameCol);
    const roundCode = roundLabel ? roundCodeFromLabel(roundLabel) : null;
    if (!roundCode) {
      warnings.push({
        sheet: sheetName,
        message: `no round for name column ${nameCol} (${roundLabel || "empty"})`,
      });
      continue;
    }

    let bowStyleCode: string | null = null;
    let ageDivisionCode: string | null = null;
    let gender: "male" | "female" | null = null;

    for (let rowNumber = 3; rowNumber <= rows; rowNumber += 1) {
      const row = sheet.getRow(rowNumber);
      const division = parseDivisionLabel(cellText(row.getCell(1)));
      if (division) {
        ageDivisionCode = division.ageDivisionCode;
        gender = division.gender;
      }

      const holder = cellText(row.getCell(nameCol));
      if (!holder) {
        continue;
      }

      const style = bowStyleCodeFromLabel(holder);
      if (style) {
        bowStyleCode = style;
        continue;
      }

      const score = integerScore(cellScalar(row.getCell(nameCol + 1)));
      if (score == null) {
        continue;
      }
      if (!bowStyleCode || !ageDivisionCode || !gender) {
        warnings.push({
          sheet: sheetName,
          message: `record without class at row ${rowNumber}: ${holder}`,
        });
        continue;
      }

      const when = parseShotWhen(cellScalar(row.getCell(nameCol + 2)));
      records.push({
        roundCode,
        bowStyleCode,
        ageDivisionCode,
        gender,
        holderName: holder,
        score,
        startsOn: when.startsOn,
        competitionName: when.label ?? "Imported record",
      });
    }
  }
}

function headingToTheLeft(sheet: ExcelJS.Worksheet, row: number, column: number): string {
  for (let current = column; current >= 1; current -= 1) {
    const text = cellText(sheet.getRow(row).getCell(current));
    if (text) {
      return text;
    }
  }
  return "";
}
