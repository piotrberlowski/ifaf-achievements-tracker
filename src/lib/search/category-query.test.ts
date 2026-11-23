import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  categoryHref,
  categoryQueryString,
  parseCategoryQuery,
  shouldRedirectCategoryQuery,
} from "./category-query.ts";

const fields = ["discipline", "bow", "age", "gender"] as const;

describe("parseCategoryQuery", () => {
  it("accepts codes and names and writes canonical codes", () => {
    const parsed = parseCategoryQuery(
      {
        discipline: "animal",
        bow: "Barebow Recurve",
        age: "young adult",
        gender: "F",
      },
      fields,
    );
    assert.equal(parsed.discipline, "ANIMAL");
    assert.equal(parsed.bow, "BB-R");
    assert.equal(parsed.age, "YA");
    assert.equal(parsed.gender, "female");
    assert.deepEqual(parsed.errors, []);
    assert.equal(
      categoryQueryString(parsed, fields),
      "discipline=ANIMAL&bow=BB-R&age=YA&gender=female",
    );
  });

  it("treats a blank value as unset", () => {
    const parsed = parseCategoryQuery({ discipline: "FIELD", bow: "FU", age: "", gender: "  " }, fields);
    assert.equal(parsed.age, null);
    assert.equal(parsed.gender, null);
    assert.equal(parsed.errors.length, 0);
  });

  it("reports an unknown value and a repeated value", () => {
    const parsed = parseCategoryQuery({ bow: "nope", age: ["A", "V"] }, fields);
    assert.equal(parsed.bow, null);
    assert.equal(parsed.age, null);
    assert.deepEqual(
      parsed.errors.map((error) => error.message),
      ["Unknown bow style \"nope\".", "Choose one age group."],
    );
  });

  it("ignores fields the page does not ask for", () => {
    const parsed = parseCategoryQuery({ round: "not-a-round", discipline: "INDOOR" }, fields);
    assert.equal(parsed.discipline, "INDOOR");
    assert.equal(parsed.round, null);
    assert.equal(parsed.errors.length, 0);
  });

  it("accepts more than one bow style when that field is multi-select", () => {
    const options = { multiple: ["bow"] } as const;
    const parsed = parseCategoryQuery(
      { discipline: "ANIMAL", bow: ["BH-R", "LB"] },
      fields,
      options,
    );
    assert.deepEqual(parsed.bows, ["BH-R", "LB"]);
    assert.equal(parsed.errors.length, 0);
    assert.equal(
      categoryHref("/records", parsed, fields, options),
      "/records?discipline=ANIMAL&bow=BH-R&bow=LB",
    );
  });

  it("accepts more than one age group when that field is multi-select", () => {
    const options = { multiple: ["age"] } as const;
    const parsed = parseCategoryQuery({ age: ["V", "adult"] }, fields, options);
    assert.equal(parsed.age, null);
    assert.deepEqual(parsed.ages, ["A", "V"]);
    assert.equal(categoryHref("/records", parsed, fields, options), "/records?age=A&age=V");
  });

  it("distinguishes age code A from YA", () => {
    assert.equal(parseCategoryQuery({ age: "a" }, fields).age, "A");
    assert.equal(parseCategoryQuery({ age: "ya" }, fields).age, "YA");
  });
});

describe("shouldRedirectCategoryQuery", () => {
  it("redirects lowercase codes and blank fields to the canonical query", () => {
    const params = { discipline: "animal", bow: "FU", age: "" };
    const parsed = parseCategoryQuery(params, fields);
    assert.equal(shouldRedirectCategoryQuery(params, parsed, fields), true);
    assert.equal(categoryHref("/gains", parsed, fields), "/gains?discipline=ANIMAL&bow=FU");
  });

  it("stays on a canonical query", () => {
    const params = { discipline: "ANIMAL", bow: "FU", gender: "male" };
    const parsed = parseCategoryQuery(params, fields);
    assert.equal(shouldRedirectCategoryQuery(params, parsed, fields), false);
    assert.equal(categoryHref("/gains", parsed, fields), "/gains?discipline=ANIMAL&bow=FU&gender=male");
  });

  it("does not redirect away from an unknown value", () => {
    const params = { discipline: "ANIMAL", bow: "nope" };
    const parsed = parseCategoryQuery(params, fields);
    assert.equal(shouldRedirectCategoryQuery(params, parsed, fields), false);
  });
});
