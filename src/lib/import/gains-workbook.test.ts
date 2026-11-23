import assert from "node:assert/strict";
import { describe, it } from "node:test";
import ExcelJS from "exceljs";
import { applyIdentityCorrection, parseIdentityCorrectionsCsv } from "./corrections.ts";
import { parseGainsWorkbook } from "./gains-workbook.ts";
import { codeForId, referenceMapsFromCatalog } from "./reference.ts";

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
  it("loads numeric scores and issued pins, and applies csv identity corrections", async () => {
    const maps = referenceMapsFromCatalog();
    const corrections = parseIdentityCorrectionsCsv(`sourceMembershipNumber,sourceFullName,targetMembershipNumber,reason
17010,Dempsey David,17011,SBG scores filed under Una Dempsey's number
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

    const parsed = await parseGainsWorkbook(buffer, maps, corrections);
    assert.equal(parsed.scores.length, 3);
    const una = parsed.people.find((person) => person.membershipNumber === "17010");
    const david = parsed.people.find((person) => person.membershipNumber === "17011");
    assert.ok(una?.id);
    assert.ok(david?.id);
    const unaScores = parsed.scores.filter((score) => score.personId === una.id);
    const davidScores = parsed.scores.filter((score) => score.personId === david.id);
    assert.equal(unaScores.length, 2);
    assert.equal(davidScores.length, 1);
    assert.equal(davidScores[0].score, 610);
    assert.equal(davidScores[0].bowStyleId, maps.bowStyleId.get("BU"));
    assert.equal(davidScores[0].ageDivisionId, maps.ageDivisionId.get("A"));
    const davidEntry = parsed.entries.find((entry) => entry.scoreId === davidScores[0].id);
    assert.equal(davidEntry?.classCode, "AMBU");
    assert.deepEqual(
      parsed.awards
        .map((award) => {
          const membership =
            parsed.people.find((person) => person.id === award.personId)?.membershipNumber;
          const track = codeForId(maps.awardTrackId, award.awardTrackId, "award track");
          return `${membership}:${track}:${award.level}`;
        })
        .sort(),
      ["17010:INDOOR:gold", "17011:ANIMAL:gold"],
    );
    assert.equal(applyIdentityCorrection("17010", "Dempsey David", corrections), "17011");
  });
});
