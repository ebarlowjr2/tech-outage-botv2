export type Severity = "critical" | "major" | "minor" | "info";
export type IncidentStatus = "Investigating" | "Identified" | "Monitoring" | "Resolved";

export interface Incident {
  id: string;
  provider: string;
  title: string;
  severity: Severity;
  region: string;
  lat: number;
  lng: number;
  timestamp: string;
  status: IncidentStatus;
  statusCode?: string;
  category: string;
  categoryLabel?: string;
  summary: string;
  impactedServices: string[];
  updates: number;
  confidence?: "low" | "medium" | "high";
  confidenceScore?: number;
  source?: string;
  sourceType?: string;
  rawUrl?: string;
  updatedAt?: string;
  resolvedAt?: string | null;
  isActive?: boolean;
  isResolved?: boolean;
  isMaintenance?: boolean;
  locationApproximate?: boolean;
}

export interface ProviderSummary {
  provider: string;
  impacted: number;
  severity: Severity;
}

export interface SeverityCounts {
  critical: number;
  major: number;
  minor: number;
  info: number;
}

export interface SourceHealthItem {
  id: string;
  name: string;
  status: "Healthy" | "Lagging" | "Degraded";
  latencyMs: number;
  lastCheck: string;
}

export interface IngestionSourceStatus {
  source: string;
  status: "ok" | "error" | "disabled";
  events_count: number;
  last_run_at: string | null;
  error_message?: string | null;
}

export interface IngestionStatusSummary {
  last_run_at: string | null;
  sources: IngestionSourceStatus[];
}

export interface RecentUpdate {
  id: string;
  message: string;
  time: string;
}

export interface TickerItem {
  id: string;
  text: string;
  tone: "info" | "warn" | "alert";
}

export interface IngestStatus {
  pipeline: string;
  state: "Nominal" | "Delayed" | "Attention";
  detail: string;
}
