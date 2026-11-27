"use client";

import { RecordResults } from "@/app/records/record-results";
import { StandingBrowser } from "@/components/StandingBrowser";
import type { RecordView, StandingRecord } from "@/lib/records/view-filter";

export function RecordsExplorer({
  initial,
  records,
}: {
  initial: RecordView;
  records: StandingRecord[];
}) {
  return (
    <StandingBrowser initial={initial} pathname="/records" records={records}>
      {(visible, view) => <RecordResults records={visible} view={view} />}
    </StandingBrowser>
  );
}
