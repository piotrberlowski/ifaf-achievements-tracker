import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "GAINS awards",
  description:
    "Explore GAINS benchmarks and award progress for Irish field archers.",
};

export default function GainsPage() {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-4 py-10 sm:px-6 sm:py-16">
      <Link className="link inline-flex items-center gap-2 self-start" href="/">
        <ArrowLeftIcon aria-hidden="true" className="size-4" />
        Back to achievements
      </Link>

      <section className="rounded-3xl bg-neutral px-6 py-10 text-neutral-content shadow-xl sm:px-10">
        <span className="badge badge-accent mb-5">Preview</span>
        <h1 className="text-4xl font-bold sm:text-5xl">GAINS awards</h1>
        <p className="mt-5 max-w-2xl text-lg leading-8 text-neutral-content/80">
          Find your next benchmark and follow your progress through Bronze,
          Silver, Gold, Hotshot, and Star.
        </p>
      </section>

      <section className="rounded-2xl border border-base-300 bg-base-100 p-6 shadow-sm sm:p-8">
        <h2 className="text-2xl font-bold">GAINS explorer coming soon</h2>
        <p className="mt-3 max-w-2xl leading-7 text-base-content/70">
          This page will let you choose a round and shooting category to see
          the scores needed for each award, along with the progress already
          recorded by IFAF archers.
        </p>
      </section>
    </div>
  );
}
