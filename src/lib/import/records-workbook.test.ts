import assert from "node:assert/strict";
import { describe, it } from "node:test";
import ExcelJS from "exceljs";
import { parseRecordsWorkbook } from "./records-workbook.ts";

describe("parseRecordsWorkbook", () => {
  it("reads a standing record including a labelled meet with no calendar day", async () => {
    const workbook = new ExcelJS.Workbook();
    const animal = workbook.addWorksheet("Animal rounds");
    animal.getCell("A1").value = "Division";
    animal.getCell("J1").value = "UAR";
    animal.getCell("J2").value = "Name";
    animal.getCell("K2").value = "Score";
    animal.getCell("L2").value = "Date";
    animal.getCell("J3").value = "BAREBOW RECURVE";
    animal.getCell("A4").value = "Senior (M)";
    animal.getCell("J4").value = "Peter Gilmore";
    animal.getCell("K4").value = 460;
    animal.getCell("L4").value = "EBHC 2026";
    workbook.addWorksheet("Indoor rounds");
    workbook.addWorksheet("Target Face Outdoor");

    const buffer = Buffer.from(await workbook.xlsx.writeBuffer());
    const parsed = await parseRecordsWorkbook(buffer);
    assert.equal(parsed.records.length, 1);
    assert.equal(parsed.records[0].roundCode, "UAR");
    assert.equal(parsed.records[0].bowStyleCode, "BB-R");
    assert.equal(parsed.records[0].ageDivisionCode, "S");
    assert.equal(parsed.records[0].gender, "male");
    assert.equal(parsed.records[0].score, 460);
    assert.equal(parsed.records[0].startsOn, null);
    assert.equal(parsed.records[0].competitionName, "EBHC 2026");
  });
});
