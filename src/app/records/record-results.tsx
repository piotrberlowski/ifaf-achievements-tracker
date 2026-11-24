import {
  ageDivisionName,
  bowCategoryName,
  disciplineName,
  genderCode,
  genderLabel,
  summary,
  type AgeDivisionCode,
  type BowStyleCode,
  type ClassFilterValue,
} from "@/lib/class-filter";
import type { RecordStanding } from "@prisma/client";

const achievedDate = new Intl.DateTimeFormat("en-IE", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

export function RecordResults({
  filter,
  records,
}: {
  filter: ClassFilterValue;
  records: RecordStanding[] | null;
}) {
  if (!records || !filter.discipline || filter.bows.length === 0) {
    return (
      <p className="text-base-content">
        Choose a discipline and a bow category to see the standing records.
      </p>
    );
  }

  const heading = resultHeading(filter);

  return (
    <section aria-labelledby="record-results" className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-bold" id="record-results">
          {heading}
        </h2>
        <p className="mt-2 text-base-content">{summary(filter, records.length)}</p>
      </div>
      {records.length === 0 ? (
        <p className="text-base-content">No standing record matches these filters.</p>
      ) : (
        <RecordTable groups={groupByRound(records)} showBow={filter.bows.length > 1} />
      )}
    </section>
  );
}

function resultHeading(filter: ClassFilterValue): string {
  const discipline = filter.discipline ? disciplineName(filter.discipline) : "";
  const styles = filter.bows.map((bow) => bowCategoryName(bow)).join(", ");
  return `${discipline} · ${styles}`;
}

function RecordTable({
  groups,
  showBow,
}: {
  groups: { roundCode: string; roundName: string; records: RecordStanding[] }[];
  showBow: boolean;
}) {
  const columns = showBow ? 6 : 5;
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
          {showBow ? <col className="w-14 md:w-16" /> : null}
        </colgroup>
        <thead>
          <tr>
            <ColumnHead label="Event" />
            <ColumnHead label="Score" />
            <ColumnHead label="Archer" />
            <ColumnHead label="Age" narrow short="Age" />
            <ColumnHead label="Gender" narrow short="G" />
            {showBow ? <ColumnHead label="Bow" narrow short="Bow" /> : null}
          </tr>
        </thead>
        <tbody>
          {groups.map((group) => (
            <RoundRows columns={columns} group={group} key={group.roundCode} showBow={showBow} />
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
  columns,
  group,
  showBow,
}: {
  columns: number;
  group: { roundCode: string; roundName: string; records: RecordStanding[] };
  showBow: boolean;
}) {
  return (
    <>
      <tr className="bg-neutral text-neutral-content">
        <th className="bg-neutral text-neutral-content" colSpan={columns} scope="colgroup">
          {group.roundName}
        </th>
      </tr>
      {group.records.map((record) => (
        <tr
          className="bg-base-200 [&>td]:bg-base-200"
          key={`${record.bowCode}-${group.roundCode}-${record.ageCode}-${record.gender}`}
        >
          <td>
            <EventCell record={record} />
          </td>
          <td>
            <span className="badge badge-accent font-semibold tabular-nums">
              {record.score.toLocaleString("en-IE")}
            </span>
          </td>
          <td>{record.holder}</td>
          <CodedCell code={record.ageCode} name={ageDivisionName(record.ageCode as AgeDivisionCode)} />
          <CodedCell code={genderCode(record.gender)} name={genderLabel(record.gender)} />
          {showBow ? <CodeCell code={record.bowCode} name={bowCategoryName(record.bowCode as BowStyleCode)} /> : null}
        </tr>
      ))}
    </>
  );
}

function CodeCell({ code, name }: { code: string; name: string }) {
  return (
    <td className="px-0.5 text-center" title={name}>
      {code}
    </td>
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

function EventCell({ record }: { record: RecordStanding }) {
  const dated = record.effectiveOn ? achievedDate.format(record.effectiveOn) : null;
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

function groupByRound(records: RecordStanding[]) {
  const groups: {
    roundCode: string;
    roundName: string;
    records: RecordStanding[];
  }[] = [];
  for (const record of records) {
    const current = groups[groups.length - 1];
    if (!current || current.roundCode !== record.roundCode) {
      groups.push({
        roundCode: record.roundCode,
        roundName: record.roundName,
        records: [record],
      });
      continue;
    }
    current.records.push(record);
  }
  return groups;
}
