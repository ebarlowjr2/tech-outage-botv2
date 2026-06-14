"use client";

import { useMemo, useState } from "react";
import { DashboardShell } from "./components/dashboard/DashboardShell";
import { TopBar } from "./components/dashboard/TopBar";
import { PanelFrame } from "./components/dashboard/PanelFrame";
import { IncidentFeed } from "./components/dashboard/IncidentFeed";
import { MainSituationPanel } from "./components/dashboard/MainSituationPanel";
import { StatsRail } from "./components/dashboard/StatsRail";
import { StatusTicker } from "./components/dashboard/StatusTicker";
import {
  incidents,
  ingestStatus,
  providerSummary,
  recentUpdates,
  severityCounts,
  sourceHealth,
  tickerItems,
} from "@/lib/mock";

export default function Page() {
  const [selectedId, setSelectedId] = useState(incidents[0]?.id ?? "");

  const selectedIncident = useMemo(() => {
    return incidents.find((incident) => incident.id === selectedId) ?? incidents[0];
  }, [selectedId]);

  return (
    <DashboardShell>
      <TopBar
        localTime="21:42"
        utcTime="01:42"
        streamStatus="Stream Nominal"
        sourceCount={sourceHealth.length}
      />

      <div className="flex-1 min-h-0 grid grid-cols-[1.05fr_2.2fr_1.1fr] gap-3">
        <PanelFrame
          title="Incident Feed"
          subtitle="Latest provider status"
          className="h-full flex flex-col"
          bodyClassName="flex-1 min-h-0 flex flex-col"
        >
          <div className="flex items-center justify-between text-xs text-[color:var(--muted)] mb-3">
            <span className="small-label">Active incidents</span>
            <span className="font-mono text-white/90">{incidents.length}</span>
          </div>
          <IncidentFeed incidents={incidents} selectedId={selectedId} onSelect={setSelectedId} />
        </PanelFrame>

        {selectedIncident && <MainSituationPanel incident={selectedIncident} incidents={incidents} />}

        <StatsRail
          activeCount={incidents.length}
          severityCounts={severityCounts}
          providerSummary={providerSummary}
          sourceHealth={sourceHealth}
          recentUpdates={recentUpdates}
          ingestStatus={ingestStatus}
        />
      </div>

      <StatusTicker items={tickerItems} />
    </DashboardShell>
  );
}
