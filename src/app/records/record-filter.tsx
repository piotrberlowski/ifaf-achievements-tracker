import FilterSubmitButton from "@/components/FilterSubmitButton";
import type { CategoryQuery } from "@/lib/search/category-query";
import { ageDivisions, awardTracks, bowStyles, genders } from "@/lib/reference/catalog";
import Form from "next/form";

const disciplineOrder = ["ANIMAL", "FIELD", "INDOOR"];

export function RecordFilter({ values }: { values: CategoryQuery }) {
  return (
    <Form action="/records" className="flex flex-col gap-6 rounded-2xl bg-neutral p-6 text-neutral-content shadow-sm sm:p-8">
      <DisciplineTabs selected={values.discipline} />
      <BowFilter selected={values.bows} />
      <details className="collapse collapse-arrow bg-base-100 text-base-content">
        <summary className="collapse-title font-medium">Age and gender</summary>
        <div className="collapse-content flex flex-col gap-4">
          <AgeFilter selected={values.ages} />
          <GenderFilter selected={values.gender} />
        </div>
      </details>
      <div className="flex flex-wrap items-center gap-3">
        <FilterSubmitButton label="Show records" />
        {values.discipline || values.bows.length > 0 ? (
          <a className="btn btn-ghost text-neutral-content" href="/records">
            Clear
          </a>
        ) : null}
      </div>
    </Form>
  );
}

function DisciplineTabs({ selected }: { selected: string | null }) {
  const tracks = [...awardTracks].sort(
    (left, right) => disciplineOrder.indexOf(left.code) - disciplineOrder.indexOf(right.code),
  );
  return (
    <div className="tabs tabs-box bg-base-100">
      {tracks.map((track) => (
        <input
          aria-label={track.name}
          className="tab"
          defaultChecked={selected === track.code}
          key={track.code}
          name="discipline"
          required
          type="radio"
          value={track.code}
        />
      ))}
    </div>
  );
}

function BowFilter({ selected }: { selected: string[] }) {
  return (
    <div className="filter">
      <input aria-label="All" className="btn btn-sm filter-reset" type="reset" value="×" />
      {bowStyles.map((style) => (
        <input
          aria-label={style.code}
          className="btn btn-sm"
          defaultChecked={selected.includes(style.code)}
          key={style.code}
          name="bow"
          title={style.name}
          type="checkbox"
          value={style.code}
        />
      ))}
    </div>
  );
}

function AgeFilter({ selected }: { selected: string[] }) {
  const everyAge = selected.length === 0;
  return (
    <div className="filter">
      {ageDivisions.map((division) => (
        <input
          aria-label={division.code}
          className="btn btn-sm"
          defaultChecked={everyAge || selected.includes(division.code)}
          key={division.code}
          name="age"
          title={division.name}
          type="checkbox"
          value={division.code}
        />
      ))}
    </div>
  );
}

function GenderFilter({ selected }: { selected: string | null }) {
  return (
    <div className="filter">
      {genders.map((gender) => (
        <input
          aria-label={gender.code}
          className="btn btn-sm"
          defaultChecked={selected === null || selected === gender.value}
          key={gender.value}
          name="gender"
          title={gender.name}
          type="checkbox"
          value={gender.value}
        />
      ))}
    </div>
  );
}
