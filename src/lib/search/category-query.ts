import { ageDivisions, awardTracks, bowStyles, genders, rounds } from "../reference/catalog.ts";

export const categoryFilterFields = ["discipline", "round", "bow", "age", "gender"] as const;

export type CategoryFilterField = (typeof categoryFilterFields)[number];

export type SearchParams = Record<string, string | string[] | undefined>;

export type CategoryQueryError = {
  field: CategoryFilterField;
  message: string;
};

export type CategoryQuery = {
  discipline: string | null;
  round: string | null;
  bow: string | null;
  bows: string[];
  age: string | null;
  ages: string[];
  gender: "male" | "female" | null;
  errors: CategoryQueryError[];
};

export type CategoryQueryOptions = {
  multiple?: readonly CategoryFilterField[];
};

const fieldLabels: Record<CategoryFilterField, string> = {
  discipline: "discipline",
  round: "round",
  bow: "bow style",
  age: "age group",
  gender: "gender",
};

export function parseCategoryQuery(
  searchParams: SearchParams,
  fields: readonly CategoryFilterField[],
  options?: CategoryQueryOptions,
): CategoryQuery {
  const query: CategoryQuery = {
    discipline: null,
    round: null,
    bow: null,
    bows: [],
    age: null,
    ages: [],
    gender: null,
    errors: [],
  };

  for (const field of fields) {
    assignField(query, field, searchParams[field], allowsMany(options, field));
  }

  return query;
}

export function categoryQueryString(
  query: CategoryQuery,
  fields: readonly CategoryFilterField[],
  options?: CategoryQueryOptions,
): string {
  const params = new URLSearchParams();
  for (const field of fields) {
    appendField(params, query, field, allowsMany(options, field));
  }
  return params.toString();
}

export function categoryHref(
  pathname: string,
  query: CategoryQuery,
  fields: readonly CategoryFilterField[],
  options?: CategoryQueryOptions,
): string {
  const qs = categoryQueryString(query, fields, options);
  return qs ? `${pathname}?${qs}` : pathname;
}

export function shouldRedirectCategoryQuery(
  searchParams: SearchParams,
  parsed: CategoryQuery,
  fields: readonly CategoryFilterField[],
  options?: CategoryQueryOptions,
): boolean {
  if (parsed.errors.length > 0) return false;
  const incoming = describeIncoming(searchParams, fields, options);
  return incoming.normalize || incoming.text !== categoryQueryString(parsed, fields, options);
}

function assignField(
  query: CategoryQuery,
  field: CategoryFilterField,
  raw: string | string[] | undefined,
  allowMany: boolean,
): void {
  const items = filledItems(raw);
  if (items.length === 0) return;
  if (!allowMany && items.length > 1) {
    query.errors.push({ field, message: `Choose one ${fieldLabels[field]}.` });
    return;
  }
  const unknown = items.find((item) => canonicalize(field, item) === null);
  if (unknown !== undefined) {
    query.errors.push({
      field,
      message: `Unknown ${fieldLabels[field]} "${shown(unknown)}".`,
    });
    return;
  }
  writeField(query, field, ordered(field, uniqueValues(field, items)), allowMany);
}

function appendField(
  params: URLSearchParams,
  query: CategoryQuery,
  field: CategoryFilterField,
  allowMany: boolean,
): void {
  const many = allowMany ? manyValues(query, field) : null;
  if (many) {
    for (const value of many) params.append(field, value);
    return;
  }
  const value = query[field];
  if (typeof value === "string" && value) params.set(field, value);
}

function describeIncoming(
  searchParams: SearchParams,
  fields: readonly CategoryFilterField[],
  options?: CategoryQueryOptions,
) {
  const params = new URLSearchParams();
  let normalize = false;
  for (const field of fields) {
    const noted = noteIncoming(searchParams[field], allowsMany(options, field));
    if (noted.normalize) normalize = true;
    for (const value of noted.values) params.append(field, value);
  }
  return { text: params.toString(), normalize };
}

function noteIncoming(
  raw: string | string[] | undefined,
  allowMany: boolean,
): { values: string[]; normalize: boolean } {
  if (raw === undefined) return { values: [], normalize: false };
  const list = Array.isArray(raw) ? raw : [raw];
  const values = list.map((item) => item.trim()).filter((item) => item !== "");
  return {
    values: allowMany ? values : values.slice(0, 1),
    normalize: incomingNeedsNormalize(list, values, allowMany),
  };
}

function incomingNeedsNormalize(list: string[], values: string[], allowMany: boolean): boolean {
  if (list.length !== values.length) return true;
  if (list.some((item, index) => item !== values[index])) return true;
  if (!allowMany && values.length > 1) return true;
  return new Set(values).size !== values.length;
}

function filledItems(raw: string | string[] | undefined): string[] {
  if (raw === undefined) return [];
  const list = Array.isArray(raw) ? raw : [raw];
  return list.map((item) => item.trim()).filter((item) => item !== "");
}

function uniqueValues(field: CategoryFilterField, items: string[]): string[] {
  const values: string[] = [];
  for (const item of items) {
    const canonical = canonicalize(field, item);
    if (canonical && !values.includes(canonical)) values.push(canonical);
  }
  return values;
}

function ordered(field: CategoryFilterField, values: string[]): string[] {
  const rank = field === "bow" ? bowRank : field === "age" ? ageRank : null;
  if (!rank) return values;
  return [...values].sort((left, right) => (rank.get(left) ?? 0) - (rank.get(right) ?? 0));
}

function writeField(
  query: CategoryQuery,
  field: CategoryFilterField,
  values: string[],
  allowMany: boolean,
): void {
  if (field === "gender") {
    const female = values.includes("female");
    const male = values.includes("male");
    query.gender = female === male ? null : female ? "female" : "male";
    return;
  }
  if (field === "bow") {
    query.bows = values;
    query.bow = allowMany ? null : (values[0] ?? null);
    return;
  }
  if (field === "age") {
    query.ages = values;
    query.age = allowMany ? null : (values[0] ?? null);
    return;
  }
  writeNamed(query, field, values[0]);
}

function writeNamed(query: CategoryQuery, field: CategoryFilterField, value: string | undefined): void {
  if (field === "discipline" && value) query.discipline = value;
  if (field === "round" && value) query.round = value;
}

function manyValues(query: CategoryQuery, field: CategoryFilterField): string[] | null {
  if (field === "bow") return query.bows;
  if (field === "age") return query.ages;
  return null;
}

function allowsMany(options: CategoryQueryOptions | undefined, field: CategoryFilterField): boolean {
  return options?.multiple?.includes(field) ?? false;
}

const bowRank = new Map<string, number>(bowStyles.map((style, index) => [style.code, index]));
const ageRank = new Map<string, number>(ageDivisions.map((division, index) => [division.code, index]));

function canonicalize(field: CategoryFilterField, input: string): string | null {
  if (field === "gender") {
    const text = input.toLowerCase();
    const gender = genders.find(
      (candidate) =>
        candidate.value === text ||
        candidate.code.toLowerCase() === text ||
        candidate.name.toLowerCase() === text,
    );
    return gender?.value ?? null;
  }
  const match = matchByCodeOrName(optionsFor(field), input);
  return match?.code ?? null;
}

function optionsFor(field: Exclude<CategoryFilterField, "gender">): readonly { code: string; name: string }[] {
  if (field === "discipline") return awardTracks;
  if (field === "round") return rounds;
  if (field === "bow") return bowStyles;
  return ageDivisions;
}

function matchByCodeOrName<T extends { code: string; name: string }>(
  options: readonly T[],
  input: string,
): T | undefined {
  const code = input.toUpperCase();
  const name = input.toLowerCase();
  return options.find(
    (option) => option.code.toUpperCase() === code || option.name.toLowerCase() === name,
  );
}

function shown(value: string): string {
  return value.length > 40 ? `${value.slice(0, 40)}…` : value;
}
