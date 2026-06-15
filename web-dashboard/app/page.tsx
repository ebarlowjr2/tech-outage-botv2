"use client";

import { useEffect, useMemo, useState } from "react";
import { DashboardShell } from "./components/dashboard/DashboardShell";
import { TopBar } from "./components/dashboard/TopBar";
import { PanelFrame } from "./components/dashboard/PanelFrame";
import { IncidentFeed } from "./components/dashboard/IncidentFeed";
import { MainSituationPanel } from "./components/dashboard/MainSituationPanel";
import { StatsRail } from "./components/dashboard/StatsRail";
import { StatusTicker } from "./components/dashboard/StatusTicker";
import { mapOutageEventToIncident } from "@/lib/outageMapper";
import type { Incident, ProviderSummary, RecentUpdate, SeverityCounts, TickerItem } from "@/lib/types";
import type { NormalizedOutageEvent } from "@/src/ingestion/types";
import {
  incidents as mockIncidents,
  ingestStatus,
  sourceHealth,
} from "@/lib/mock";

const initialIncidents = process.env.NODE_ENV === "production" ? [] : mockIncidents;

export default function Page() {
  const [incidents, setIncidents] = useState<Incident[]>(initialIncidents);
  const [selectedId, setSelectedId] = useState(initialIncidents[0]?.id ?? "");

  useEffect(() => {
    let cancelled = false;

    async function loadOutages() {
      try {
        const response = await fetch("/api/outages?status=active", { cache: "no-store" });
        if (!response.ok) return;

        const payload = (await response.json()) as { events?: NormalizedOutageEvent[] };
        const normalizedIncidents = (payload.events ?? []).map(mapOutageEventToIncident);

        if (!cancelled) {
          setIncidents(normalizedIncidents);
          setSelectedId((currentId) => {
            if (normalizedIncidents.some((incident) => incident.id === currentId)) return currentId;
            return normalizedIncidents[0]?.id ?? "";
          });
        }
      } catch (error) {
        console.warn("[dashboard] failed to load normalized outage feed", error);
      }
    }

    loadOutages();
    const refreshTimer = window.setInterval(loadOutages, 60_000);

    return () => {
      cancelled = true;
      window.clearInterval(refreshTimer);
    };
  }, []);

  const selectedIncident = useMemo(() => {
    return incidents.find((incident) => incident.id === selectedId) ?? incidents[0] ?? monitoringIncident;
  }, [incidents, selectedId]);

  const severityCounts = useMemo<SeverityCounts>(() => {
    return incidents.reduce(
      (counts, incident) => {
        counts[incident.severity] += 1;
        return counts;
      },
      { critical: 0, major: 0, minor: 0, info: 0 },
    );
  }, [incidents]);

  const providerSummary = useMemo<ProviderSummary[]>(() => {
    const byProvider = new Map<string, ProviderSummary>();

    for (const incident of incidents) {
      const existing = byProvider.get(incident.provider);
      if (!existing) {
        byProvider.set(incident.provider, {
          provider: incident.provider,
          impacted: incident.impactedServices.length || 1,
          severity: incident.severity,
        });
        continue;
      }

      existing.impacted += incident.impactedServices.length || 1;
      if (severityWeight[incident.severity] > severityWeight[existing.severity]) {
        existing.severity = incident.severity;
      }
    }

    return [...byProvider.values()].sort((a, b) => b.impacted - a.impacted).slice(0, 5);
  }, [incidents]);

  const recentUpdates = useMemo<RecentUpdate[]>(() => {
    return incidents.slice(0, 4).map((incident) => ({
      id: incident.id,
      message: `${incident.provider}: ${incident.title}`,
      time: incident.timestamp,
    }));
  }, [incidents]);

  const tickerItems = useMemo<TickerItem[]>(() => {
    return incidents.map((incident) => ({
      id: incident.id,
      text: `${incident.provider}: ${incident.title}`,
      tone: incident.severity === "critical" ? "alert" : incident.severity === "major" ? "warn" : "info",
    }));
  }, [incidents]);

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

        <MainSituationPanel incident={selectedIncident} incidents={incidents} />

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

const severityWeight = {
  critical: 4,
  major: 3,
  minor: 2,
  info: 1,
};

const monitoringIncident: Incident = {
  id: "global-watch",
  provider: "Global Watch",
  title: "No active normalized outages detected",
  severity: "info",
  region: "worldwide",
  lat: 20,
  lng: 0,
  timestamp: "Live",
  status: "Monitoring",
  category: "Operations",
  summary: "Automated ingestion is standing by and scanning provider status feeds for new tech and power outage signals.",
  impactedServices: ["Status feeds", "Network monitors", "Power outage sources"],
  updates: 0,
  confidence: "high",
  confidenceScore: 100,
  source: "monitoring-shell",
};
