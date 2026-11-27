"use client";

import { BowChoice, ChoiceFilter } from "@/app/records/choice-filter";
import { RecordResults } from "@/app/records/record-results";
import GainsThresholds from "@/components/GainsThresholds";
import { ageDivisions, awardTracks, genders } from "@/lib/reference/catalog";
import {
  allAges,
  allGenders,
  narrowSelection,
  recordIsVisible,
  standingFilterFields,
  standingFilterQuery,
  type RecordView,
  type StandingRecord,
} from "@/lib/records/view-filter";
import { categoryHref, type CategoryQuery } from "@/lib/search/category-query";
import { ChevronRightIcon } from "@heroicons/react/24/outline";
import { useState, type ReactNode } from "react";

const disciplineOrder = ["ANIMAL", "FIELD", "INDOOR"];

const tracks = [...awardTracks].sort(
  (left, right) => disciplineOrder.indexOf(left.code) - disciplineOrder.indexOf(right.code),
);

export function RecordBrowser({
  initial,
  pathname,
  records,
}: {
  initial: RecordView;
  pathname: "/gains" | "/records";
  records: StandingRecord[];
}) {
  const [view, setView] = useState(initial);
  const visible = records.filter((record) => recordIsVisible(record, view));
  const apply = (next: RecordView) => {
    setView(next);
    window.history.replaceState(
      null,
      "",
      categoryHref(pathname, viewToQuery(next), standingFilterFields, standingFilterQuery),
    );
  };

  return (
    <div className="tabs tabs-lift w-full">
      {tracks.map((track) => (
        <DisciplineTab
          active={view.discipline === track.code}
          key={track.code}
          name={track.name}
          onSelect={() => apply({ ...view, discipline: track.code })}
        >
          {view.discipline === track.code ? (
            <RecordTab onApply={apply} view={view}>
              {pathname === "/records" ? (
                <RecordResults records={visible} view={view} />
              ) : (
                <GainsThresholds records={visible} view={view} />
              )}
            </RecordTab>
          ) : null}
        </DisciplineTab>
      ))}
    </div>
  );
}

function DisciplineTab({
  active,
  children,
  name,
  onSelect,
}: {
  active: boolean;
  children: ReactNode;
  name: string;
  onSelect: () => void;
}) {
  return (
    <>
      <input
        aria-label={name}
        checked={active}
        className="tab"
        name="discipline"
        onChange={onSelect}
        type="radio"
        value={name}
      />
      <div className="tab-content border-base-300 bg-base-100 p-4 text-base-content sm:p-6">{children}</div>
    </>
  );
}

function RecordTab({
  children,
  onApply,
  view,
}: {
  children: ReactNode;
  onApply: (next: RecordView) => void;
  view: RecordView;
}) {
  return (
    <div className="flex flex-col gap-6">
      <BowChoice onSelect={(bow) => onApply({ ...view, bow })} selected={view.bow} />
      <OptionalFilters onApply={onApply} view={view} />
      {children}
    </div>
  );
}

function OptionalFilters({ onApply, view }: { onApply: (next: RecordView) => void; view: RecordView }) {
  return (
    <details className="group collapse bg-base-200">
      <summary className="collapse-title flex cursor-pointer list-none items-center gap-2 font-medium [&::-webkit-details-marker]:hidden">
        <ChevronRightIcon aria-hidden="true" className="size-4 transition-transform group-open:rotate-90" />
        Optional filters
      </summary>
      <div className="collapse-content flex flex-col gap-4">
        <ChoiceFilter
          legend="Age group"
          onAll={() => onApply({ ...view, ages: [...allAges] })}
          onToggle={(code) => onApply({ ...view, ages: narrowSelection(view.ages, code, allAges) })}
          options={ageDivisions.map((division) => ({ value: division.code, label: division.code, title: division.name }))}
          selected={view.ages}
        />
        <ChoiceFilter
          legend="Gender"
          onAll={() => onApply({ ...view, genders: [...allGenders] })}
          onToggle={(value) => onApply({ ...view, genders: narrowSelection(view.genders, value, allGenders) })}
          options={genders.map((gender) => ({ value: gender.value, label: gender.code, title: gender.name }))}
          selected={view.genders}
        />
      </div>
    </details>
  );
}

function viewToQuery(view: RecordView): CategoryQuery {
  return {
    discipline: view.discipline,
    round: null,
    bow: view.bow,
    bows: [],
    age: null,
    ages: view.ages.length === allAges.length ? [] : catalogOrder(view.ages, allAges),
    gender: view.genders.length === 1 ? view.genders[0] : null,
    errors: [],
  };
}

function catalogOrder<T extends string>(values: readonly T[], catalog: readonly T[]): T[] {
  const rank = new Map<string, number>(catalog.map((value, index) => [value, index]));
  return [...values].sort((left, right) => (rank.get(left) ?? 0) - (rank.get(right) ?? 0));
}
