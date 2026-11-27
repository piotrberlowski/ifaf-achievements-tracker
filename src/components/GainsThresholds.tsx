import {
  ageDivisionName,
  bowCategoryName,
  disciplineName,
  genderCode,
  genderLabel,
} from "@/app/records/labels";
import { gainsBands } from "@/lib/gains/cutoffs";
import { standingThresholds, type GainsThresholdRow } from "@/lib/gains/thresholds";
import {
  groupStandingsByRound,
  type RecordView,
  type StandingRecord,
} from "@/lib/records/view-filter";

const scoreFormat = new Intl.NumberFormat("en-IE");
const columnCount = 7;

export default function GainsThresholds({
  records,
  view,
}: {
  records: StandingRecord[];
  view: RecordView;
}) {
  const rows = standingThresholds(records);
  const groups = groupStandingsByRound(rows);
  const heading = `${disciplineName(view.discipline)} · ${bowCategoryName(view.bow)}`;

  return (
    <section aria-labelledby="gains-scores-heading" className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-bold" id="gains-scores-heading">
          {heading}
        </h2>
        <p className="mt-2 text-base-content">
          Each round has its own record. A score on any of these rounds counts toward the same{" "}
          {disciplineName(view.discipline)} pins. Shoot at least the number shown. Two scores at one
          level earn that pin. A Star score also counts as Gold until Hotshot is earned.
        </p>
      </div>
      {rows.length === 0 ? (
        <p className="text-base-content">No standing record matches these filters, so there is no GAINS score.</p>
      ) : (
        <ThresholdTable groups={groups} />
      )}
    </section>
  );
}

function ThresholdTable({
  groups,
}: {
  groups: { roundCode: string; roundName: string; records: GainsThresholdRow[] }[];
}) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-base-300 bg-base-100">
      <table className="table table-xs w-full table-fixed text-base-content md:table-sm">
        <caption className="sr-only">GAINS scores</caption>
        <thead>
          <tr>
            {gainsBands.map((band) => (
              <ColumnHead key={band.level} label={`${band.label} (${band.percent}%)`} />
            ))}
            <ColumnHead label="Record" />
            <ColumnHead label="Age" narrow short="Age" />
            <ColumnHead label="Gender" narrow short="G" />
          </tr>
        </thead>
        <tbody>
          {groups.map((group) => (
            <RoundRows group={group} key={group.roundCode} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ColumnHead({
  label,
  narrow = false,
  short,
}: {
  label: string;
  narrow?: boolean;
  short?: string;
}) {
  return (
    <th
      className={`bg-accent text-accent-content ${narrow ? "px-0.5 text-center md:px-3 md:text-left" : "text-right"}`}
      scope="col"
    >
      {short ? (
        <>
          <span className="md:hidden">{short}</span>
          <span className="hidden md:inline">{label}</span>
        </>
      ) : (
        label
      )}
    </th>
  );
}

function RoundRows({
  group,
}: {
  group: { roundCode: string; roundName: string; records: GainsThresholdRow[] };
}) {
  return (
    <>
      <tr className="bg-neutral text-neutral-content">
        <th className="bg-neutral text-neutral-content" colSpan={columnCount} scope="colgroup">
          {group.roundName}
        </th>
      </tr>
      {group.records.map((row) => (
        <tr
          className="bg-base-200 [&>td]:bg-base-200"
          key={`${row.roundCode}-${row.ageDivisionCode}-${row.gender}`}
        >
          {gainsBands.map((band) => (
            <td className="text-right font-medium tabular-nums" key={band.level}>
              {scoreFormat.format(row[band.level])}
            </td>
          ))}
          <td className="text-right">
            <span className="font-semibold tabular-nums">{scoreFormat.format(row.record)}</span>
            <span className="mt-0.5 block text-xs font-normal text-base-content/70">{row.holderName}</span>
          </td>
          <CodedCell code={row.ageDivisionCode} name={ageDivisionName(row.ageDivisionCode)} />
          <CodedCell code={genderCode(row.gender)} name={genderLabel(row.gender)} />
        </tr>
      ))}
    </>
  );
}

function CodedCell({ code, name }: { code: string; name: string }) {
  return (
    <td className="px-0.5 text-center md:px-3 md:text-left" title={name}>
      <span className="md:hidden">{code}</span>
      <span className="hidden md:inline">{name}</span>
    </td>
  );
}
