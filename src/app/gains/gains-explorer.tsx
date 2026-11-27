"use client";

import GainsThresholds from "@/components/GainsThresholds";
import { StandingBrowser } from "@/components/StandingBrowser";
import type { RecordView, StandingRecord } from "@/lib/records/view-filter";

export function GainsExplorer({
  initial,
  records,
}: {
  initial: RecordView;
  records: StandingRecord[];
}) {
  return (
    <StandingBrowser initial={initial} pathname="/gains" records={records}>
      {(visible, view) => <GainsThresholds records={visible} view={view} />}
    </StandingBrowser>
  );
}
