"use client";

import { useEffect, useMemo, useState } from "react";
import { DashboardShell } from "./components/dashboard/DashboardShell";
import { TopBar } from "./components/dashboard/TopBar";
import { PanelFrame } from "./components/dashboard/PanelFrame";
import { IncidentFeed } from "./components/dashboard/IncidentFeed";
import { MainSituationPanel } from "./components/dashboard/MainSituationPanel";
import { StatsRail } from "./components/dashboard/StatsRail";
import { StatusTicker } from "./components/dashboard/StatusTicker";
import { DashboardFilters, type DashboardFilterState } from "./components/dashboard/DashboardFilters";
import { mapOutageEventToIncident } from "@/lib/outageMapper";
import type {
  Incident,
  IngestStatus,
  IngestionStatusSummary,
  ProviderSummary,
  RecentUpdate,
  SeverityCounts,
  SourceHealthItem,
  TickerItem,
} from "@/lib/types";
import type { OutageCategory } from "@/src/ingestion/types";
import type { NormalizedOutageEvent } from "@/src/ingestion/types";
import {
  incidents as mockIncidents,
  ingestStatus,
  sourceHealth as mockSourceHealth,
} from "@/lib/mock";

const initialIncidents = process.env.NODE_ENV === "production" ? [] : mockIncidents;
const defaultCategories: OutageCategory[] = [
  "cloud",
  "telecom",
  "cellular",
  "satellite",
  "power",
  "cdn",
  "saas",
  "internet",
  "bgp",
  "dns",
];
const defaultFilters: DashboardFilterState = {
  includeResolved: false,
  selectedCategories: defaultCategories,
  confidence: ["high", "medium"],
};

export default function Page() {
  const [incidents, setIncidents] = useState<Incident[]>(initialIncidents);
  const [selectedId, setSelectedId] = useState(initialIncidents[0]?.id ?? "");
  const [filters, setFilters] = useState<DashboardFilterState>(defaultFilters);
  const [feedMode, setFeedMode] = useState<"active" | "recent">("active");
  const [ingestionStatus, setIngestionStatus] = useState<IngestionStatusSummary | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadOutages() {
      try {
        const activeQuery = buildOutageQuery({
          status: filters.includeResolved ? "all" : "active",
          sinceHours: 24,
          filters,
        });
        const response = await fetch(`/api/outages?${activeQuery}`, { cache: "no-store" });
        if (!response.ok) return;

        const payload = (await response.json()) as { events?: NormalizedOutageEvent[] };
        let normalizedIncidents = (payload.events ?? []).map(mapOutageEventToIncident);
        let nextMode: "active" | "recent" = filters.includeResolved ? "recent" : "active";

        if (!filters.includeResolved && normalizedIncidents.length === 0) {
          const recentQuery = buildOutageQuery({ status: "all", sinceHours: 72, filters });
          const recentResponse = await fetch(`/api/outages?${recentQuery}`, { cache: "no-store" });

          if (recentResponse.ok) {
            const recentPayload = (await recentResponse.json()) as { events?: NormalizedOutageEvent[] };
            normalizedIncidents = (recentPayload.events ?? []).map(mapOutageEventToIncident);
            nextMode = "recent";
          }
        }

        if (!cancelled) {
          setIncidents(normalizedIncidents);
          setFeedMode(nextMode);
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
  }, [filters]);

  useEffect(() => {
    let cancelled = false;

    async function loadIngestionStatus() {
      try {
        const response = await fetch("/api/ingestion/status", { cache: "no-store" });
        if (!response.ok) return;
        const payload = (await response.json()) as IngestionStatusSummary;
        if (!cancelled) setIngestionStatus(payload);
      } catch (error) {
        console.warn("[dashboard] failed to load ingestion source status", error);
      }
    }

    loadIngestionStatus();
    const refreshTimer = window.setInterval(loadIngestionStatus, 60_000);

    return () => {
      cancelled = true;
      window.clearInterval(refreshTimer);
    };
  }, []);

  const selectedIncident = useMemo(() => {
    return incidents.find((incident) => incident.id === selectedId) ?? incidents[0] ?? monitoringIncident;
  }, [incidents, selectedId]);

  const severityCounts = useMemo<SeverityCounts>(() => {
    return activeIncidents(incidents).reduce(
      (counts, incident) => {
        counts[incident.severity] += 1;
        return counts;
      },
      { critical: 0, major: 0, minor: 0, info: 0 },
    );
  }, [incidents]);

  const providerSummary = useMemo<ProviderSummary[]>(() => {
    const byProvider = new Map<string, ProviderSummary>();

    for (const incident of activeIncidents(incidents)) {
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
      message: `${incident.provider}: ${incident.isResolved ? "Resolved" : incident.status} - ${incident.title}`,
      time: incident.timestamp,
    }));
  }, [incidents]);

  const tickerItems = useMemo<TickerItem[]>(() => {
    return buildTickerItems(incidents, ingestionStatus);
  }, [incidents, ingestionStatus]);

  const activeCount = useMemo(() => activeIncidents(incidents).length, [incidents]);
  const sourceHealth = useMemo(() => mapSourceHealth(ingestionStatus) ?? mockSourceHealth, [ingestionStatus]);
  const ingestStatusItems = useMemo(() => mapIngestStatus(ingestionStatus) ?? ingestStatus, [ingestionStatus]);

  return (
    <DashboardShell>
      <TopBar
        localTime="21:42"
        utcTime="01:42"
        streamStatus="Stream Nominal"
        sourceCount={ingestionStatus?.sources.length ?? sourceHealth.length}
      />
      <DashboardFilters value={filters} onChange={setFilters} />

      <div className="flex-1 min-h-0 grid grid-cols-[1.05fr_2.2fr_1.1fr] gap-3">
        <PanelFrame
          title="Incident Feed"
          subtitle={feedMode === "active" ? "Latest provider status" : "Recent Global Activity"}
          className="h-full flex flex-col"
          bodyClassName="flex-1 min-h-0 flex flex-col"
        >
          <div className="flex items-center justify-between text-xs text-[color:var(--muted)] mb-3">
            <span className="small-label">Active incidents</span>
            <span className="font-mono text-white/90">{activeCount}</span>
          </div>
          <IncidentFeed incidents={incidents} selectedId={selectedId} onSelect={setSelectedId} />
        </PanelFrame>

        <MainSituationPanel incident={selectedIncident} incidents={incidents} mode={feedMode} />

        <StatsRail
          activeCount={activeCount}
          severityCounts={severityCounts}
          providerSummary={providerSummary}
          sourceHealth={sourceHealth}
          recentUpdates={recentUpdates}
          ingestStatus={ingestStatusItems}
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

function buildOutageQuery({
  status,
  sinceHours,
  filters,
}: {
  status: "active" | "all";
  sinceHours: number;
  filters: DashboardFilterState;
}) {
  const params = new URLSearchParams({
    status,
    since: new Date(Date.now() - sinceHours * 60 * 60 * 1000).toISOString(),
    limit: "100",
  });

  if (filters.selectedCategories.length) {
    params.set("category", filters.selectedCategories.join(","));
  }

  if (filters.confidence.length) {
    params.set("confidence", filters.confidence.join(","));
  }

  return params.toString();
}

function activeIncidents(items: Incident[]) {
  return items.filter((incident) => incident.isActive !== false && !incident.isResolved && !incident.isMaintenance);
}

function buildTickerItems(items: Incident[], ingestionStatus: IngestionStatusSummary | null): TickerItem[] {
  const activeMajor = items.filter((incident) => incident.isActive && ["critical", "major"].includes(incident.severity));
  const activeMinor = items.filter((incident) => incident.isActive && incident.severity === "minor");
  const resolved = items.filter((incident) => incident.isResolved);
  const ordered = [...activeMajor, ...activeMinor, ...resolved].slice(0, 12);

  const incidentItems = ordered.map((incident) => ({
    id: incident.id,
    text: formatTickerText(incident),
    tone: incident.severity === "critical" ? "alert" : incident.severity === "major" ? "warn" : "info",
  }));

  if (incidentItems.length) return incidentItems;

  if (ingestionStatus?.sources.length) {
    const enabled = ingestionStatus.sources.filter((source) => source.status !== "disabled").length;
    const disabled = ingestionStatus.sources.length - enabled;
    return [
      {
        id: "source-health-summary",
        text: `SOURCE HEALTH - ${enabled} enabled sources - ${disabled} disabled or missing-key sources - Last run ${formatRelativeTime(ingestionStatus.last_run_at)}`,
        tone: "info",
      },
    ];
  }

  return [];
}

function formatTickerText(incident: Incident) {
  if (incident.isResolved) {
    return `[RESOLVED] ${incident.provider} - ${incident.title} - Resolved ${formatRelativeTime(incident.resolvedAt || incident.updatedAt)}`;
  }

  return `[${incident.severity.toUpperCase()}] ${incident.provider} - ${incident.title} - ${incident.status} - Updated ${formatRelativeTime(incident.updatedAt)}`;
}

function formatRelativeTime(value?: string | null) {
  if (!value) return "recently";

  const diffMinutes = Math.max(0, Math.round((Date.now() - new Date(value).getTime()) / 60_000));
  if (diffMinutes < 1) return "just now";
  if (diffMinutes < 60) return `${diffMinutes} min ago`;

  const hours = Math.round(diffMinutes / 60);
  return `${hours} hr ago`;
}

function mapSourceHealth(summary: IngestionStatusSummary | null): SourceHealthItem[] | null {
  if (!summary?.sources.length) return null;

  return summary.sources.slice(0, 8).map((source) => ({
    id: source.source,
    name: source.source,
    status: source.status === "ok" ? "Healthy" : source.status === "error" ? "Degraded" : "Lagging",
    latencyMs: source.events_count,
    lastCheck: formatRelativeTime(source.last_run_at),
  }));
}

function mapIngestStatus(summary: IngestionStatusSummary | null): IngestStatus[] | null {
  if (!summary?.sources.length) return null;

  const enabled = summary.sources.filter((source) => source.status !== "disabled").length;
  const disabled = summary.sources.filter((source) => source.status === "disabled").length;
  const errored = summary.sources.filter((source) => source.status === "error").length;
  const lastRunEvents = summary.sources.reduce((total, source) => total + source.events_count, 0);

  return [
    {
      pipeline: "Last ingestion run",
      state: errored ? "Attention" : "Nominal",
      detail: `${formatRelativeTime(summary.last_run_at)} - ${lastRunEvents} events observed`,
    },
    {
      pipeline: "Enabled sources",
      state: enabled ? "Nominal" : "Attention",
      detail: `${enabled} enabled, ${disabled} disabled or missing keys`,
    },
  ];
}
