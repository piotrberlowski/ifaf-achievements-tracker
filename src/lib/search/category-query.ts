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

type NamedOption = { code: string; name: string };

type SingleAccess = {
  write: (query: CategoryQuery, code: string) => void;
  read: (query: CategoryQuery) => string | null;
};

type RepeatableAccess = {
  writeOne: (query: CategoryQuery, code: string) => void;
  writeMany: (query: CategoryQuery, codes: string[]) => void;
  readOne: (query: CategoryQuery) => string | null;
  readMany: (query: CategoryQuery) => readonly string[];
};

abstract class CategoryField {
  abstract readonly key: CategoryFilterField;
  abstract readonly label: string;

  readInto(query: CategoryQuery, raw: string | string[] | undefined, allowMany: boolean): void {
    const items = filledItems(raw);
    if (items.length === 0) return;
    if (!allowMany && items.length > 1) {
      query.errors.push({ field: this.key, message: `Choose one ${this.label}.` });
      return;
    }
    const unknown = items.find((item) => this.canonical(item) === null);
    if (unknown !== undefined) {
      query.errors.push({ field: this.key, message: `Unknown ${this.label} "${shown(unknown)}".` });
      return;
    }
    this.store(query, this.order(this.unique(items)), allowMany);
  }

  appendTo(params: URLSearchParams, query: CategoryQuery, allowMany: boolean): void {
    this.publish(params, query, allowMany);
  }

  protected abstract canonical(input: string): string | null;
  protected abstract store(query: CategoryQuery, values: string[], allowMany: boolean): void;
  protected abstract publish(params: URLSearchParams, query: CategoryQuery, allowMany: boolean): void;

  protected order(values: string[]): string[] {
    return values;
  }

  private unique(items: string[]): string[] {
    const values: string[] = [];
    for (const item of items) {
      const canonical = this.canonical(item);
      if (canonical && !values.includes(canonical)) values.push(canonical);
    }
    return values;
  }
}

abstract class CodeField extends CategoryField {
  readonly key: CategoryFilterField;
  readonly label: string;
  protected readonly options: readonly NamedOption[];

  constructor(key: CategoryFilterField, label: string, options: readonly NamedOption[]) {
    super();
    this.key = key;
    this.label = label;
    this.options = options;
  }

  protected canonical(input: string): string | null {
    return matchByCodeOrName(this.options, input)?.code ?? null;
  }
}

class SingleCodeField extends CodeField {
  private readonly access: SingleAccess;

  constructor(key: CategoryFilterField, label: string, options: readonly NamedOption[], access: SingleAccess) {
    super(key, label, options);
    this.access = access;
  }

  protected store(query: CategoryQuery, values: string[]): void {
    const code = values[0];
    if (code) this.access.write(query, code);
  }

  protected publish(params: URLSearchParams, query: CategoryQuery): void {
    const value = this.access.read(query);
    if (value) params.set(this.key, value);
  }
}

class RepeatableCodeField extends CodeField {
  private readonly access: RepeatableAccess;

  constructor(key: CategoryFilterField, label: string, options: readonly NamedOption[], access: RepeatableAccess) {
    super(key, label, options);
    this.access = access;
  }

  protected order(values: string[]): string[] {
    const rank = new Map(this.options.map((option, index) => [option.code, index]));
    return [...values].sort((left, right) => (rank.get(left) ?? 0) - (rank.get(right) ?? 0));
  }

  protected store(query: CategoryQuery, values: string[], allowMany: boolean): void {
    if (allowMany) {
      this.access.writeMany(query, values);
      return;
    }
    const code = values[0];
    if (code) this.access.writeOne(query, code);
  }

  protected publish(params: URLSearchParams, query: CategoryQuery, allowMany: boolean): void {
    if (allowMany) {
      for (const value of this.access.readMany(query)) params.append(this.key, value);
      return;
    }
    const value = this.access.readOne(query);
    if (value) params.set(this.key, value);
  }
}

class GenderField extends CategoryField {
  readonly key = "gender" as const;
  readonly label = "gender";

  protected canonical(input: string): string | null {
    const text = input.toLowerCase();
    const gender = genders.find((candidate) => genderMatches(candidate, text));
    return gender?.value ?? null;
  }

  protected store(query: CategoryQuery, values: string[]): void {
    query.gender = oneGender(values);
  }

  protected publish(params: URLSearchParams, query: CategoryQuery): void {
    if (query.gender) params.set(this.key, query.gender);
  }
}

const categoryFields: Record<CategoryFilterField, CategoryField> = {
  discipline: new SingleCodeField("discipline", "discipline", awardTracks, {
    write: (query, code) => {
      query.discipline = code;
    },
    read: (query) => query.discipline,
  }),
  round: new SingleCodeField("round", "round", rounds, {
    write: (query, code) => {
      query.round = code;
    },
    read: (query) => query.round,
  }),
  bow: new RepeatableCodeField("bow", "bow style", bowStyles, {
    writeOne: (query, code) => {
      query.bow = code;
      query.bows = [code];
    },
    writeMany: (query, codes) => {
      query.bow = null;
      query.bows = codes;
    },
    readOne: (query) => query.bow,
    readMany: (query) => query.bows,
  }),
  age: new RepeatableCodeField("age", "age group", ageDivisions, {
    writeOne: (query, code) => {
      query.age = code;
      query.ages = [code];
    },
    writeMany: (query, codes) => {
      query.age = null;
      query.ages = codes;
    },
    readOne: (query) => query.age,
    readMany: (query) => query.ages,
  }),
  gender: new GenderField(),
};

export function parseCategoryQuery(
  searchParams: SearchParams,
  fields: readonly CategoryFilterField[],
  options?: CategoryQueryOptions,
): CategoryQuery {
  const query = emptyQuery();
  for (const field of fields) {
    categoryFields[field].readInto(query, searchParams[field], allowsMany(options, field));
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
    categoryFields[field].appendTo(params, query, allowsMany(options, field));
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

function emptyQuery(): CategoryQuery {
  return {
    discipline: null,
    round: null,
    bow: null,
    bows: [],
    age: null,
    ages: [],
    gender: null,
    errors: [],
  };
}

function allowsMany(options: CategoryQueryOptions | undefined, field: CategoryFilterField): boolean {
  return options?.multiple?.includes(field) ?? false;
}

function genderMatches(candidate: (typeof genders)[number], text: string): boolean {
  return candidate.value === text || candidate.code.toLowerCase() === text || candidate.name.toLowerCase() === text;
}

function oneGender(values: readonly string[]): CategoryQuery["gender"] {
  const male = values.includes("male");
  const female = values.includes("female");
  if (male === female) return null;
  return male ? "male" : "female";
}

function filledItems(raw: string | string[] | undefined): string[] {
  if (raw === undefined) return [];
  const list = Array.isArray(raw) ? raw : [raw];
  return list.map((item) => item.trim()).filter((item) => item !== "");
}

function matchByCodeOrName(options: readonly NamedOption[], input: string): NamedOption | undefined {
  const code = input.toUpperCase();
  const name = input.toLowerCase();
  return options.find((option) => option.code.toUpperCase() === code || option.name.toLowerCase() === name);
}

function shown(value: string): string {
  return value.length > 40 ? `${value.slice(0, 40)}…` : value;
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
