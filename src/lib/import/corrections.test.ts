import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  applyIdentityCorrection,
  parseIdentityCorrectionsCsv,
  unappliedCorrections,
} from "./corrections.ts";

const csv = `sourceMembershipNumber,sourceFullName,targetMembershipNumber,reason
IRE_17010,Dempsey David,IRE_17011,SBG scores filed under Una Dempsey's number
`;

describe("identity corrections", () => {
  it("rewrites only the source number and name from the csv", () => {
    const corrections = parseIdentityCorrectionsCsv(csv);
    assert.equal(
      applyIdentityCorrection("IRE_17010", "Dempsey David", corrections),
      "IRE_17011",
    );
    assert.equal(
      applyIdentityCorrection("IRE_17010", "Dempsey Una", corrections),
      "IRE_17010",
    );
  });

  it("reports rows that still match a csv correction", () => {
    const corrections = parseIdentityCorrectionsCsv(csv);
    assert.deepEqual(
      unappliedCorrections(corrections, [
        { membershipNumber: "IRE_17010", archerName: "Dempsey Una" },
        { membershipNumber: "IRE_17011", archerName: "Dempsey David" },
      ]),
      [],
    );
    assert.equal(
      unappliedCorrections(corrections, [
        { membershipNumber: "IRE_17010", archerName: "Dempsey David" },
      ]).length,
      1,
    );
  });
});
