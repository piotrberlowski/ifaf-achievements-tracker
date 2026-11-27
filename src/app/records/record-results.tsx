import { ageDivisionName, bowCategoryName, disciplineName, genderCode, genderLabel, standingSummary } from "@/app/records/labels";
import { groupStandingsByRound, type RecordView, type StandingRecord } from "@/lib/records/view-filter";

const achievedDate = new Intl.DateTimeFormat("en-IE", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

export function RecordResults({
  records,
  view,
}: {
  records: StandingRecord[];
  view: RecordView;
}) {
  return (
    <section aria-labelledby="record-results" className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-bold" id="record-results">
          {resultHeading(view)}
        </h2>
        <p className="mt-2 text-base-content">{standingSummary(view, records.length)}</p>
      </div>
      {records.length === 0 ? (
        <p className="text-base-content">No standing record matches these filters.</p>
      ) : (
        <RecordTable groups={groupStandingsByRound(records)} />
      )}
    </section>
  );
}

function resultHeading(view: RecordView): string {
  return `${disciplineName(view.discipline)} · ${bowCategoryName(view.bow)}`;
}

function RecordTable({
  groups,
}: {
  groups: { roundCode: string; roundName: string; records: StandingRecord[] }[];
}) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-base-300 bg-base-100">
      <table className="table table-xs w-full table-fixed text-base-content md:table-sm">
        <caption className="sr-only">Standing records</caption>
        <colgroup>
          <col />
          <col className="w-14 md:w-20" />
          <col />
          <col className="w-8 md:w-28" />
          <col className="w-8 md:w-24" />
        </colgroup>
        <thead>
          <tr>
            <ColumnHead label="Event" />
            <ColumnHead label="Score" />
            <ColumnHead label="Archer" />
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
      className={`bg-accent text-accent-content ${narrow ? "px-0.5 text-center md:px-3 md:text-left" : ""}`}
      scope="col"
    >
      <ColumnLabel label={label} short={short} />
    </th>
  );
}

function ColumnLabel({ label, short }: { label: string; short?: string }) {
  if (!short) return label;
  return (
    <>
      <span className="md:hidden">{short}</span>
      <span className="hidden md:inline">{label}</span>
    </>
  );
}

function RoundRows({
  group,
}: {
  group: { roundCode: string; roundName: string; records: StandingRecord[] };
}) {
  return (
    <>
      <tr className="bg-neutral text-neutral-content">
        <th className="bg-neutral text-neutral-content" colSpan={5} scope="colgroup">
          {group.roundName}
        </th>
      </tr>
      {group.records.map((record) => (
        <tr className="bg-base-200 [&>td]:bg-base-200" key={`${group.roundCode}-${record.ageCode}-${record.gender}`}>
          <td>
            <EventCell record={record} />
          </td>
          <td>
            <span className="badge badge-accent font-semibold tabular-nums">
              {record.score.toLocaleString("en-IE")}
            </span>
          </td>
          <td>{record.holder}</td>
          <CodedCell code={record.ageCode} name={ageDivisionName(record.ageCode)} />
          <CodedCell code={genderCode(record.gender)} name={genderLabel(record.gender)} />
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

function EventCell({ record }: { record: StandingRecord }) {
  const dated = record.effectiveOn ? achievedDate.format(new Date(record.effectiveOn)) : null;
  const event = record.eventName === "Imported record" ? null : record.eventName;
  if (dated && event) {
    return (
      <div>
        <div className="whitespace-nowrap">{dated}</div>
        <div className="text-sm text-base-content">{event}</div>
      </div>
    );
  }
  if (dated) {
    return <span className="whitespace-nowrap">{dated}</span>;
  }
  if (event) {
    return event;
  }
  return <span className="text-base-content">Date unknown</span>;
}
