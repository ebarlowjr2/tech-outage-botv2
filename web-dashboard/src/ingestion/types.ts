export type OutageCategory =
  | "internet"
  | "cloud"
  | "cellular"
  | "telecom"
  | "satellite"
  | "power"
  | "data_center"
  | "cdn"
  | "dns"
  | "bgp"
  | "saas"
  | "unknown";

export type OutageStatus =
  | "investigating"
  | "identified"
  | "monitoring"
  | "degraded"
  | "partial_outage"
  | "major_outage"
  | "resolved"
  | "maintenance"
  | "unknown";

export type Severity = "info" | "minor" | "major" | "critical";
export type ConfidenceLevel = "low" | "medium" | "high";
export type SourceType = "official" | "measurement" | "aggregator" | "community" | "commercial" | "derived";

export interface NormalizedOutageEvent {
  event_id: string;
  source: string;
  source_type: SourceType;
  category: OutageCategory;
  provider?: string;
  service?: string;
  status: OutageStatus;
  severity: Severity;
  confidence: ConfidenceLevel;
  confidence_score: number;
  location: {
    country?: string;
    region?: string;
    city?: string;
    lat?: number;
    lon?: number;
  };
  network?: {
    asn?: string;
    as_name?: string;
    prefix?: string;
    ip_version?: "ipv4" | "ipv6";
  };
  impact?: {
    affected_users?: number;
    affected_customers?: number;
    affected_regions?: string[];
    impacted_services?: string[];
  };
  started_at: string;
  updated_at: string;
  resolved_at?: string | null;
  title: string;
  summary: string;
  raw_url?: string;
  raw_payload?: unknown;
  dedupe_key: string;
  created_at: string;
}

export type OutageEvent = NormalizedOutageEvent;
