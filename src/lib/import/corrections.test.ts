import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  applyIdentityCorrection,
  parseIdentityCorrectionsCsv,
} from "./corrections.ts";

const csv = `sourceMembershipNumber,sourceFullName,targetMembershipNumber,reason
IRE_17010,Dempsey David,IRE_17011,SBG scores filed under Una Dempsey's number
`;

describe("identity corrections", () => {
  it("moves Dempsey David from IRE_17010 to IRE_17011", () => {
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
});
