import assert from "node:assert/strict";
import { describe, it } from "node:test";
import ExcelJS from "exceljs";
import { applyIdentityCorrection, parseIdentityCorrectionsCsv } from "./corrections.ts";
import { parseGainsWorkbook } from "./gains-workbook.ts";

async function workbookBuffer(build: (wb: ExcelJS.Workbook) => void): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  build(workbook);
  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

function addGainsSheet(
  workbook: ExcelJS.Workbook,
  name: string,
  trackerCol: string,
  competitions: Array<{ col: string; event: string; date: number; round: string }>,
) {
  const sheet = workbook.addWorksheet(name);
  sheet.getCell("A4").value = "Number";
  sheet.getCell("B4").value = "NAME";
  sheet.getCell("C4").value = "STYLE";
  sheet.getCell("C1").value = "Event";
  sheet.getCell("C2").value = "Date";
  sheet.getCell("C3").value = "Round";
  sheet.getCell(`${trackerCol}1`).value = "GAIN AWARD TRACKER";
  for (const competition of competitions) {
    sheet.getCell(`${competition.col}1`).value = competition.event;
    sheet.getCell(`${competition.col}2`).value = competition.date;
    sheet.getCell(`${competition.col}3`).value = competition.round;
  }
  return sheet;
}

describe("parseGainsWorkbook", () => {
  it("loads numeric scores and issued pins, and applies the Dempsey correction", async () => {
    const corrections = parseIdentityCorrectionsCsv(`sourceMembershipNumber,sourceFullName,targetMembershipNumber,reason
IRE_17010,Dempsey David,IRE_17011,SBG scores filed under Una Dempsey's number
`);
    const buffer = await workbookBuffer((workbook) => {
      const indoor = addGainsSheet(workbook, "Gains Indoor", "F", [
        { col: "D", event: "Craigavon AC", date: 45326, round: "Flint" },
        { col: "E", event: "Craigavon AC", date: 45326, round: "Indoor" },
      ]);
      indoor.getCell("A5").value = "IRE_17010";
      indoor.getCell("B5").value = "Dempsey Una";
      indoor.getCell("C5").value = "VFBU";
      indoor.getCell("D5").value = 240;
      indoor.getCell("E5").value = 248;
      indoor.getCell("F5").value = "GOLD,g,g";

      addGainsSheet(workbook, "Gains Field Rounds", "Y", []);
      addGainsSheet(workbook, "Gains BowHunter Rounds", "DF", []);

      const sbg = addGainsSheet(workbook, "Gains SBG Round", "K", [
        { col: "D", event: "Wexford Archery", date: 44815, round: "SBG" },
      ]);
      sbg.getCell("A5").value = "IRE_17010";
      sbg.getCell("B5").value = "Dempsey David";
      sbg.getCell("C5").value = "AMBU";
      sbg.getCell("D5").value = 610;
      sbg.getCell("K5").value = "GOLD";
    });

    const parsed = await parseGainsWorkbook(buffer, corrections);
    assert.equal(parsed.scores.length, 3);
    const una = parsed.scores.filter((score) => score.membershipNumber === "IRE_17010");
    const david = parsed.scores.filter((score) => score.membershipNumber === "IRE_17011");
    assert.equal(una.length, 2);
    assert.equal(david.length, 1);
    assert.equal(david[0].score, 610);
    assert.equal(david[0].classCode, "AMBU");
    assert.deepEqual(
      parsed.pins.map((pin) => `${pin.membershipNumber}:${pin.awardTrackCode}:${pin.level}`).sort(),
      ["IRE_17010:INDOOR:gold", "IRE_17011:ANIMAL:gold"],
    );
    assert.equal(
      applyIdentityCorrection("IRE_17010", "Dempsey David", corrections),
      "IRE_17011",
    );
  });
});
