import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { fromExcelSerial, parseShotWhen, utcDate } from "./dates.ts";

describe("parseShotWhen", () => {
  it("reads an Excel serial as a calendar day", () => {
    const parsed = parseShotWhen(45326);
    assert.deepEqual(parsed.startsOn, fromExcelSerial(45326));
    assert.equal(parsed.label, null);
  });

  it("reads a serial stored as text", () => {
    const parsed = parseShotWhen("45326.0");
    assert.deepEqual(parsed.startsOn, fromExcelSerial(45326));
    assert.equal(parsed.label, null);
  });

  it("reads day/month/year text", () => {
    assert.deepEqual(parseShotWhen("25/7/21"), {
      startsOn: utcDate(2021, 7, 25),
      label: null,
    });
    assert.deepEqual(parseShotWhen("15/11/2025"), {
      startsOn: utcDate(2025, 11, 15),
      label: null,
    });
  });

  it("keeps a meet label when there is no calendar day", () => {
    assert.deepEqual(parseShotWhen("EBHC 2026"), {
      startsOn: null,
      label: "EBHC 2026",
    });
    assert.deepEqual(parseShotWhen("UKIFAC 2024"), {
      startsOn: null,
      label: "UKIFAC 2024",
    });
  });
});
