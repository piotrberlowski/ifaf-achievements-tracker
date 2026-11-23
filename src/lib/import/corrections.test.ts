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
  it("stores the membership number without the workbook prefix", () => {
    const corrections = parseIdentityCorrectionsCsv(csv);
    assert.equal(corrections[0].sourceMembershipNumber, "17010");
    assert.equal(corrections[0].targetMembershipNumber, "17011");
    assert.equal(applyIdentityCorrection("17010", "Dempsey David", corrections), "17011");
    assert.equal(applyIdentityCorrection("17010", "Dempsey Una", corrections), "17010");
  });

  it("reports rows that still match a csv correction", () => {
    const corrections = parseIdentityCorrectionsCsv(csv);
    assert.deepEqual(
      unappliedCorrections(corrections, [
        { membershipNumber: "17010", archerName: "Dempsey Una" },
        { membershipNumber: "17011", archerName: "Dempsey David" },
      ]),
      [],
    );
    assert.equal(
      unappliedCorrections(corrections, [
        { membershipNumber: "17010", archerName: "Dempsey David" },
      ]).length,
      1,
    );
  });
});
