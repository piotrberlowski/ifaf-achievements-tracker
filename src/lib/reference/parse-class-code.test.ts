import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  ageDivisions,
  awardTracks,
  bowStyles,
  classCodes,
  genders,
  rounds,
} from "./catalog.ts";
import { parseClassCode } from "./parse-class-code.ts";

const trackCodes = new Set<string>(awardTracks.map((track) => track.code));

describe("parseClassCode", () => {
  it("parses AFFS-R as Adult Female Freestyle Limited Recurve", () => {
    assert.deepEqual(parseClassCode("AFFS-R"), {
      code: "AFFS-R",
      ageDivisionCode: "A",
      ageDivisionName: "Adult",
      gender: "female",
      bowStyleCode: "FS-R",
      bowStyleName: "Freestyle Limited Recurve",
    });
  });

  it("parses AMFU as Adult Male Freestyle Unlimited", () => {
    assert.deepEqual(parseClassCode("AMFU"), {
      code: "AMFU",
      ageDivisionCode: "A",
      ageDivisionName: "Adult",
      gender: "male",
      bowStyleCode: "FU",
      bowStyleName: "Freestyle Unlimited",
    });
  });

  it("parses AMTR as Adult Male Traditional Recurve", () => {
    assert.deepEqual(parseClassCode("AMTR"), {
      code: "AMTR",
      ageDivisionCode: "A",
      ageDivisionName: "Adult",
      gender: "male",
      bowStyleCode: "TR",
      bowStyleName: "Traditional Recurve",
    });
  });

  it("parses SMBB-R as Senior Male Barebow Recurve", () => {
    assert.deepEqual(parseClassCode("SMBB-R"), {
      code: "SMBB-R",
      ageDivisionCode: "S",
      ageDivisionName: "Senior",
      gender: "male",
      bowStyleCode: "BB-R",
      bowStyleName: "Barebow Recurve",
    });
  });

  it("normalises AMTR(IFAF) to AMTR", () => {
    assert.deepEqual(parseClassCode("AMTR(IFAF)"), parseClassCode("AMTR"));
  });
});

describe("reference catalog", () => {
  it("has 12 styles, 6 age divisions, 2 genders, and 144 written class codes", () => {
    assert.equal(bowStyles.length, 12);
    assert.equal(ageDivisions.length, 6);
    assert.equal(genders.length, 2);
    assert.equal(classCodes.length, 144);
    assert.equal(rounds.length, 12);
    assert.equal(awardTracks.length, 3);
    assert.equal(new Set(classCodes.map((row) => row.code)).size, 144);
  });

  it("points every round at Indoor, Animal, or Field", () => {
    assert.deepEqual(
      awardTracks.map((track) => track.name),
      ["Indoor", "Animal", "Field"],
    );
    for (const round of rounds) {
      assert.equal(trackCodes.has(round.awardTrackCode), true, round.code);
    }
  });

  it("marks only SBG_ARCHIVED as display-only", () => {
    const displayOnly = rounds.filter((round) => round.displayOnly).map((round) => round.code);
    assert.deepEqual(displayOnly, ["SBG_ARCHIVED"]);
  });

  it("parses every written class code back to its age, gender, and style", () => {
    for (const classCode of classCodes) {
      const parsed = parseClassCode(classCode.code);
      assert.ok(parsed, classCode.code);
      assert.equal(parsed.ageDivisionCode, classCode.ageDivisionCode);
      assert.equal(parsed.gender, classCode.gender);
      assert.equal(parsed.bowStyleCode, classCode.bowStyleCode);
    }
  });

  it("keeps the longer Young Adult prefix ahead of Adult", () => {
    const parsed = parseClassCode("YAMFU");
    assert.equal(parsed?.ageDivisionCode, "YA");
    assert.equal(parsed?.gender, "male");
    assert.equal(parsed?.bowStyleCode, "FU");
  });
});
