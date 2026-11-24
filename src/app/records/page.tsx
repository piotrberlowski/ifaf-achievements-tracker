import { RecordFilter } from "@/app/records/record-filter";
import { RecordResults } from "@/app/records/record-results";
import type { AgeDivisionCode, AwardTrackCode, BowStyleCode } from "@/lib/class-filter";
import { ageDivisions, bowStyles } from "@/lib/reference/catalog";
import { findStandingRecords } from "@/lib/records/standings";
import {
  categoryHref,
  parseCategoryQuery,
  shouldRedirectCategoryQuery,
  type CategoryFilterField,
  type CategoryQueryOptions,
  type SearchParams,
} from "@/lib/search/category-query";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "IFAF records",
  description:
    "Find Irish Field Archery Federation records by discipline and bow style.",
};

const recordFields = ["discipline", "bow", "age", "gender"] as const satisfies readonly CategoryFilterField[];
const recordQuery: CategoryQueryOptions = { multiple: ["bow", "age", "gender"] };

export default async function RecordsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const parsed = parseCategoryQuery(params, recordFields, recordQuery);
  if (parsed.ages.length === ageDivisions.length) parsed.ages = [];
  if (shouldRedirectCategoryQuery(params, parsed, recordFields, recordQuery)) {
    redirect(categoryHref("/records", parsed, recordFields, recordQuery));
  }

  const discipline = asDiscipline(parsed.discipline);
  const bows = asBows(parsed.bows);
  const records =
    discipline && bows.length > 0 && parsed.errors.length === 0
      ? await findStandingRecords({
          discipline,
          bow: bows,
          age: asAges(parsed.ages),
          gender: parsed.gender,
        })
      : null;

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-10 sm:px-6 sm:py-16">
      <Link className="link inline-flex items-center gap-2 self-start" href="/">
        <ArrowLeftIcon aria-hidden="true" className="size-4" />
        Back to achievements
      </Link>

      <section className="rounded-3xl bg-neutral px-6 py-10 text-neutral-content shadow-xl sm:px-10">
        <h1 className="text-4xl font-bold sm:text-5xl">IFAF records</h1>
        <p className="mt-5 max-w-2xl text-lg leading-8 text-neutral-content">
          Find standing records for a discipline and the bow styles you pick. Age
          groups and gender narrow the class.
        </p>
      </section>

      {parsed.errors.length > 0 ? (
        <div className="rounded-2xl border border-error/40 bg-error/10 px-4 py-3 text-sm" role="alert">
          <ul className="list-disc pl-5">
            {parsed.errors.map((error) => (
              <li key={error.field}>{error.message}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <RecordFilter values={parsed} />
      <RecordResults
        filter={{
          discipline,
          bows,
          ages: asAges(parsed.ages),
          gender: parsed.gender,
        }}
        records={records}
      />
    </div>
  );
}

function asDiscipline(value: string | null): AwardTrackCode | null {
  if (value === "INDOOR" || value === "ANIMAL" || value === "FIELD") return value;
  return null;
}

const bowCodes = new Set<string>(bowStyles.map((style) => style.code));
const ageCodes = new Set<string>(ageDivisions.map((division) => division.code));

function asBows(values: string[]): BowStyleCode[] {
  return values.filter((value): value is BowStyleCode => bowCodes.has(value));
}

function asAges(values: string[]): AgeDivisionCode[] {
  return values.filter((value): value is AgeDivisionCode => ageCodes.has(value));
}
