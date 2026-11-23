import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "IFAF records",
  description:
    "Explore Irish Field Archery Federation records by round and shooting class.",
};

export default function RecordsPage() {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-4 py-10 sm:px-6 sm:py-16">
      <Link className="link inline-flex items-center gap-2 self-start" href="/">
        <ArrowLeftIcon aria-hidden="true" className="size-4" />
        Back to achievements
      </Link>

      <section className="rounded-3xl bg-neutral px-6 py-10 text-neutral-content shadow-xl sm:px-10">
        <span className="badge badge-accent mb-5">Preview</span>
        <h1 className="text-4xl font-bold sm:text-5xl">IFAF records</h1>
        <p className="mt-5 max-w-2xl text-lg leading-8 text-neutral-content/80">
          Discover the highest approved scores for every IFAA round type and
          shooting class.
        </p>
      </section>

      <section className="rounded-2xl border border-base-300 bg-base-100 p-6 shadow-sm sm:p-8">
        <h2 className="text-2xl font-bold">Record explorer coming soon</h2>
        <p className="mt-3 max-w-2xl leading-7 text-base-content/70">
          This page will let you filter records by round, age division, gender,
          and bow style, then see the record score, holder, and date achieved.
        </p>
      </section>
    </div>
  );
}
