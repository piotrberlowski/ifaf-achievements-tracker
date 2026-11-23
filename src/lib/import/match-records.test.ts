import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { DivisionGender } from "@prisma/client";
import { emptyBundle, registerPerson } from "./bundle.ts";
import { matchStandingRecords } from "./match-records.ts";
import { referenceMapsFromCatalog } from "./reference.ts";

const maps = referenceMapsFromCatalog();

describe("matchStandingRecords", () => {
  it("reuses a GAINS score with the same round, class, and score", () => {
    const bundle = emptyBundle();
    const peopleByNumber = new Map<string, string>();
    const personId = registerPerson(bundle, peopleByNumber, "1", "Gilmore Peter", null);
    const competitionId = "comp-1";
    const submissionId = "sub-1";
    const scoreId = "score-1";
    bundle.competitions.push({
      id: competitionId,
      name: "EBHC",
      startsOn: null,
      roundCode: "UAR",
      roundId: maps.round.get("UAR")?.id,
      countsForGains: true,
    });
    bundle.submissions.push({
      id: submissionId,
      competitionId,
      status: "pending",
      source: "import",
      externalId: "gains:bowhunter:J",
    });
    bundle.scores.push({
      id: scoreId,
      personId,
      bowStyleId: maps.bowStyleId.get("BB-R") ?? "",
      ageDivisionId: maps.ageDivisionId.get("S") ?? "",
      gender: DivisionGender.male,
      competitionId,
      score: 460,
    });
    bundle.entries.push({
      submissionId,
      membershipNumber: "1",
      archerName: "Gilmore Peter",
      classCode: "SMBB-R",
      bowStyleId: maps.bowStyleId.get("BB-R"),
      ageDivisionId: maps.ageDivisionId.get("S"),
      gender: DivisionGender.male,
      score: 460,
      scoreId,
    });

    const matched = matchStandingRecords(
      [
        {
          roundCode: "UAR",
          roundId: maps.round.get("UAR")?.id ?? "",
          bowStyleId: maps.bowStyleId.get("BB-R") ?? "",
          ageDivisionId: maps.ageDivisionId.get("S") ?? "",
          gender: DivisionGender.male,
          holderName: "Peter Gilmore",
          score: 460,
          startsOn: null,
          competitionName: "EBHC 2026",
        },
      ],
      bundle,
      maps,
    );
    assert.equal(matched.matched, 1);
    assert.equal(bundle.scores.length, 1);
  });

  it("creates a record-only score when the standing record is not already in GAINS", () => {
    const bundle = emptyBundle();
    const matched = matchStandingRecords(
      [
        {
          roundCode: "EXPERT",
          roundId: maps.round.get("EXPERT")?.id ?? "",
          bowStyleId: maps.bowStyleId.get("BU") ?? "",
          ageDivisionId: maps.ageDivisionId.get("A") ?? "",
          gender: DivisionGender.male,
          holderName: "Terry Dempsey",
          score: 353,
          startsOn: null,
          competitionName: "UKIFAC 2016",
        },
      ],
      bundle,
      maps,
    );
    assert.equal(matched.matched, 0);
    assert.equal(bundle.scores.length, 1);
    assert.equal(bundle.competitions[0].countsForGains, false);
    assert.equal(bundle.competitions[0].name, "UKIFAC 2016");
    assert.equal(bundle.competitions[0].roundId, maps.round.get("EXPERT")?.id);
    assert.match(bundle.people[0].membershipNumber, /^EXT_/);
  });

  it("uses the GAINS score when several members share the holder's name", () => {
    const bundle = emptyBundle();
    const peopleByNumber = new Map<string, string>();
    const holderId = registerPerson(bundle, peopleByNumber, "10", "Smith John", null);
    registerPerson(bundle, peopleByNumber, "11", "John Smith", null);
    const competitionId = "comp-shared";
    const scoreId = "score-shared";
    bundle.competitions.push({
      id: competitionId,
      name: "Club",
      startsOn: null,
      roundCode: "UAR",
      roundId: maps.round.get("UAR")?.id,
      countsForGains: true,
    });
    bundle.scores.push({
      id: scoreId,
      personId: holderId,
      bowStyleId: maps.bowStyleId.get("BB-R") ?? "",
      ageDivisionId: maps.ageDivisionId.get("S") ?? "",
      gender: DivisionGender.male,
      competitionId,
      score: 460,
    });
    bundle.entries.push({
      submissionId: "sub-shared",
      membershipNumber: "10",
      archerName: "Smith John",
      classCode: "SMBB-R",
      score: 460,
      scoreId,
    });

    const matched = matchStandingRecords(
      [
        {
          roundCode: "UAR",
          roundId: maps.round.get("UAR")?.id ?? "",
          bowStyleId: maps.bowStyleId.get("BB-R") ?? "",
          ageDivisionId: maps.ageDivisionId.get("S") ?? "",
          gender: DivisionGender.male,
          holderName: "John Smith",
          score: 460,
          startsOn: null,
          competitionName: "Club",
        },
      ],
      bundle,
      maps,
    );
    assert.equal(matched.matched, 1);
    assert.equal(bundle.scores.length, 1);
    assert.equal(bundle.people.length, 2);
  });
});
