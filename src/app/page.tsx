import { achievementStats } from "@/lib/achievement-stats";
import {
  ArrowRightIcon,
  ChartBarIcon,
  TrophyIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";

const stats = [
  {
    label: "Archers",
    value: achievementStats.archers,
    icon: UserGroupIcon,
  },
  {
    label: "GAINS scores",
    value: achievementStats.gainsScores,
    icon: ChartBarIcon,
  },
  {
    label: "Standing records",
    value: achievementStats.records,
    icon: TrophyIcon,
  },
];

export default function Home() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-12 px-4 py-10 sm:px-6 sm:py-16">
      <section className="overflow-hidden rounded-3xl bg-neutral px-6 py-12 text-neutral-content shadow-xl sm:px-10 lg:px-14">
        <p className="mb-4 text-sm font-semibold tracking-[0.2em] text-accent uppercase">
          IFAF achievements
        </p>
        <h1 className="max-w-3xl text-4xl leading-tight font-bold sm:text-5xl">
          Celebrate every step of your archery journey
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-neutral-content/80">
          Welcome to the home of GAINS awards and records for the{" "}
          <a
            className="font-semibold text-accent underline decoration-accent/40 underline-offset-4 hover:decoration-accent"
            href="https://fieldarchery.ie/"
          >
            Irish Field Archery Federation
          </a>
          . Follow the progress of IFAF archers, celebrate new milestones, and
          discover the scores that set the standard.
        </p>
      </section>

      <section aria-labelledby="achievement-stats">
        <h2 className="sr-only" id="achievement-stats">
          Achievement statistics
        </h2>
        <dl className="grid gap-4 sm:grid-cols-3">
          {stats.map(({ icon: Icon, label, value }) => (
            <div
              className="stat rounded-2xl border border-base-300 bg-base-100 shadow-sm"
              key={label}
            >
              <div className="stat-figure text-primary">
                <Icon aria-hidden="true" className="size-8" />
              </div>
              <dt className="stat-title">{label}</dt>
              <dd className="stat-value text-primary">
                {value.toLocaleString("en-IE")}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section aria-labelledby="explore-achievements">
        <div className="mb-6 max-w-2xl">
          <p className="text-sm font-semibold tracking-wider text-primary uppercase">
            Explore
          </p>
          <h2 className="mt-2 text-3xl font-bold" id="explore-achievements">
            Records and GAINS
          </h2>
          <p className="mt-3 text-base-content/70">
            Open a section to learn how each achievement works.
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <details
            className="collapse-arrow collapse rounded-2xl border border-base-300 bg-base-100 shadow-sm"
            name="achievements"
          >
            <summary className="collapse-title text-xl font-semibold">
              IFAF records
            </summary>
            <div className="collapse-content">
              <div className="max-w-3xl space-y-4 text-base leading-7 text-base-content/80">
                <p>
                  IFAF records recognise the highest approved score shot in
                  every IFAA round type. Records are held within each shooting
                  class—defined by age division, gender, and bow style—so
                  archers are measured alongside their peers.
                </p>
                <p>
                  A higher approved score becomes the new record. If an archer
                  reaches the maximum score possible for a round, that record
                  can still be equalled, but it can never be beaten.
                </p>
                <Link className="btn btn-primary mt-2" href="/records">
                  Explore IFAF records
                  <ArrowRightIcon aria-hidden="true" className="size-4" />
                </Link>
              </div>
            </div>
          </details>

          <details
            className="collapse-arrow collapse rounded-2xl border border-base-300 bg-base-100 shadow-sm"
            name="achievements"
          >
            <summary className="collapse-title text-xl font-semibold">
              GAINS awards
            </summary>
            <div className="collapse-content">
              <div className="max-w-3xl space-y-4 text-base leading-7 text-base-content/80">
                <p>
                  GAINS awards are a celebration of your progress as an archer.
                  They challenge you to measure your scores against the best
                  achieved by your peers and reward you at every step along the
                  way.
                </p>
                <p>
                  Awards are earned in three disciplines: Animal, Field, and
                  Indoor. The round you shoot determines which discipline your
                  score counts towards.
                </p>
                <p>
                  IFAF records provide the benchmarks for your progress. Your
                  score is measured against the relevant record on the day of
                  the shoot. Bronze begins at 50% of that record, Silver at 70%,
                  Gold at 80%, and Star at 90%.
                </p>
                <p>
                  Every score is recorded at the highest level it reaches. Two
                  scores at the same level within the same discipline earn that
                  pin. A Gold score does not count towards Silver. Once you earn
                  a higher pin, you have passed the lower milestones and will
                  not be awarded those pins afterwards.
                </p>
                <p>
                  Rounds within a discipline all contribute to the same awards.
                  For example, UAR and 3-D Standard—the two most commonly shot
                  GAINS rounds—both count towards Animal. A Bronze score in each
                  would earn your Animal Bronze pin. Field and Hunter contribute
                  to Field in the same way.
                </p>
                <p>
                  Eight scores at Gold level or above in one discipline earn
                  Hotshot. A score at 90% or above also counts as Gold while you
                  work towards Hotshot. Star is awarded after Hotshot, once you
                  have two scores at 90% or above.
                </p>
                <p>
                  Every qualifying score stays on your record and carries
                  forward from year to year. Scores remain attached to the
                  shooting category in which they were achieved, so you can
                  build progress in each category you shoot.
                </p>
                <Link className="btn btn-primary mt-2" href="/gains">
                  Explore GAINS awards
                  <ArrowRightIcon aria-hidden="true" className="size-4" />
                </Link>
              </div>
            </div>
          </details>
        </div>
      </section>
    </div>
  );
}
