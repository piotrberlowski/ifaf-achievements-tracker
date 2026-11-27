import { RecordBrowser } from "@/app/records/record-browser";
import { listStandingRecords } from "@/lib/records/standings";
import {
  initialRecordView,
  standingFilterFields,
  standingFilterQuery,
  withStandingDefaults,
} from "@/lib/records/view-filter";
import {
  categoryHref,
  parseCategoryQuery,
  shouldRedirectCategoryQuery,
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

export default async function RecordsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const parsed = withStandingDefaults(
    parseCategoryQuery(params, standingFilterFields, standingFilterQuery),
  );
  if (shouldRedirectCategoryQuery(params, parsed, standingFilterFields, standingFilterQuery)) {
    redirect(categoryHref("/records", parsed, standingFilterFields, standingFilterQuery));
  }

  const records = parsed.errors.length === 0 ? await listStandingRecords() : [];

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-10 sm:px-6 sm:py-16">
      <Link className="link inline-flex items-center gap-2 self-start" href="/">
        <ArrowLeftIcon aria-hidden="true" className="size-4" />
        Back to achievements
      </Link>

      <section className="rounded-3xl bg-neutral px-6 py-10 text-neutral-content shadow-xl sm:px-10">
        <h1 className="text-4xl font-bold sm:text-5xl">IFAF records</h1>
        <p className="mt-5 max-w-2xl text-lg leading-8 text-neutral-content">
          Standing records for the open discipline are listed in that tab. Filters narrow the list.
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
      ) : (
        <RecordBrowser initial={initialRecordView(parsed)} pathname="/records" records={records} />
      )}
    </div>
  );
}
