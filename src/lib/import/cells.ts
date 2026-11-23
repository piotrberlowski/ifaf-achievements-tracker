import ExcelJS from "exceljs";

type FormulaValue = { formula?: string; result?: ExcelJS.CellValue; sharedFormula?: string };
type RichTextValue = { richText: Array<{ text?: string }> };
type HyperlinkValue = { text?: string; hyperlink?: string };

export async function readWorkbook(source: string | Buffer | ArrayBuffer): Promise<ExcelJS.Workbook> {
  const workbook = new ExcelJS.Workbook();
  if (typeof source === "string") {
    await workbook.xlsx.readFile(source);
  } else {
    const bytes = source instanceof ArrayBuffer ? new Uint8Array(source) : Uint8Array.from(source);
    // exceljs types Buffer from an older @types/node than this project.
    await workbook.xlsx.load(Buffer.from(bytes) as never);
  }
  return workbook;
}

export function unwrapCellValue(value: ExcelJS.CellValue): unknown {
  if (value == null) {
    return null;
  }
  if (value instanceof Date) {
    return value;
  }
  if (typeof value !== "object") {
    return value;
  }
  if ("richText" in value) {
    return (value as RichTextValue).richText.map((part) => part.text ?? "").join("");
  }
  if ("text" in value && !("formula" in value) && !("sharedFormula" in value) && !("result" in value)) {
    return (value as HyperlinkValue).text ?? "";
  }
  if ("result" in value || "formula" in value || "sharedFormula" in value) {
    return unwrapCellValue((value as FormulaValue).result ?? null);
  }
  return value;
}

export function cellScalar(cell: ExcelJS.Cell): unknown {
  return unwrapCellValue(cell.value);
}

export function cellText(cell: ExcelJS.Cell): string {
  const value = cellScalar(cell);
  if (value == null || value instanceof Date) {
    return "";
  }
  return String(value).trim();
}

export function cellNumber(cell: ExcelJS.Cell): number | null {
  const value = cellScalar(cell);
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return null;
}

export function integerScore(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    const rounded = Math.round(value);
    if (Math.abs(value - rounded) < 1e-6) {
      return rounded;
    }
  }
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return integerScore(parsed);
    }
  }
  return null;
}

export function columnCount(sheet: ExcelJS.Worksheet): number {
  return Math.max(sheet.columnCount, sheet.actualColumnCount, 1);
}

export function rowCount(sheet: ExcelJS.Worksheet): number {
  return Math.max(sheet.rowCount, sheet.actualRowCount, 1);
}
