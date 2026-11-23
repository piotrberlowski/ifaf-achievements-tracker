import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { matchStandingRecords } from "./match-records.ts";
import type { ImportPerson, ImportScore, StandingRecord } from "./types.ts";

describe("matchStandingRecords", () => {
  it("reuses a GAINS score with the same round, class, and score", () => {
    const people: ImportPerson[] = [
      { membershipNumber: "IRE_1", names: [{ fullName: "Gilmore Peter", note: null }] },
    ];
    const scores: ImportScore[] = [
      {
        competitionExternalId: "gains:bowhunter:J",
        membershipNumber: "IRE_1",
        archerName: "Gilmore Peter",
        classCode: "SMBB-R",
        bowStyleCode: "BB-R",
        ageDivisionCode: "S",
        gender: "male",
        score: 460,
      },
    ];
    const records: StandingRecord[] = [
      {
        roundCode: "UAR",
        bowStyleCode: "BB-R",
        ageDivisionCode: "S",
        gender: "male",
        holderName: "Peter Gilmore",
        score: 460,
        startsOn: null,
        competitionName: "EBHC 2026",
      },
    ];
    const matched = matchStandingRecords(
      records,
      people,
      scores,
      new Map([["gains:bowhunter:J", "UAR"]]),
    );
    assert.equal(matched.matched, 1);
    assert.equal(matched.scores.length, 0);
  });

  it("creates a record-only score when the standing record is not already in GAINS", () => {
    const matched = matchStandingRecords(
      [
        {
          roundCode: "EXPERT",
          bowStyleCode: "BU",
          ageDivisionCode: "A",
          gender: "male",
          holderName: "Terry Dempsey",
          score: 353,
          startsOn: null,
          competitionName: "UKIFAC 2016",
        },
      ],
      [],
      [],
      new Map(),
    );
    assert.equal(matched.matched, 0);
    assert.equal(matched.scores.length, 1);
    assert.equal(matched.competitions[0].countsForGains, false);
    assert.equal(matched.competitions[0].name, "UKIFAC 2016");
    assert.match(matched.people[0].membershipNumber, /^EXT_/);
  });
});
