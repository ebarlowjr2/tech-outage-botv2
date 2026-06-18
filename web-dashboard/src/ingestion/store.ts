import type { NormalizedOutageEvent } from "./types";
import { createServerSupabaseClient } from "./db";

type OutageEventRow = {
  event_id: string;
  source: string;
  source_type: string;
  category: string;
  provider?: string | null;
  service?: string | null;
  status: string;
  severity: string;
  confidence: string;
  confidence_score: number;
  country?: string | null;
  region?: string | null;
  city?: string | null;
  lat?: number | null;
  lon?: number | null;
  asn?: string | null;
  as_name?: string | null;
  prefix?: string | null;
  ip_version?: string | null;
  affected_users?: number | null;
  affected_customers?: number | null;
  affected_regions?: string[] | null;
  impacted_services?: string[] | null;
  started_at: string;
  updated_at: string;
  resolved_at?: string | null;
  title: string;
  summary: string;
  raw_url?: string | null;
  raw_payload?: unknown;
  dedupe_key: string;
};

export async function upsertOutageEvents(events: NormalizedOutageEvent[]): Promise<void> {
  if (!events.length) return;

  const supabase = createServerSupabaseClient();
  const rows = events.map(toOutageEventRow);
  const { error } = await supabase.from("outage_events").upsert(rows, {
    onConflict: "source,event_id",
  });

  if (error) {
    throw new Error(`Failed to upsert outage events: ${error.message}`);
  }
}

export async function recordIngestionRun({
  source,
  status,
  eventsCount,
  errorMessage,
  startedAt,
  completedAt,
}: {
  source: string;
  status: "ok" | "error" | "disabled";
  eventsCount: number;
  errorMessage?: string | null;
  startedAt: string;
  completedAt?: string;
}): Promise<void> {
  const supabase = createServerSupabaseClient();
  const { error } = await supabase.from("ingestion_runs").insert({
    source,
    status,
    events_count: eventsCount,
    error_message: errorMessage ?? null,
    started_at: startedAt,
    completed_at: completedAt ?? new Date().toISOString(),
  });

  if (error) {
    console.warn(`[ingestion] failed to record run for ${source}: ${error.message}`);
  }
}

function toOutageEventRow(event: NormalizedOutageEvent): OutageEventRow {
  return {
    event_id: event.event_id,
    source: event.source,
    source_type: event.source_type,
    category: event.category,
    provider: event.provider ?? null,
    service: event.service ?? null,
    status: event.status,
    severity: event.severity,
    confidence: event.confidence,
    confidence_score: event.confidence_score,
    country: event.location.country ?? null,
    region: event.location.region ?? null,
    city: event.location.city ?? null,
    lat: event.location.lat ?? null,
    lon: event.location.lon ?? null,
    asn: event.network?.asn ?? null,
    as_name: event.network?.as_name ?? null,
    prefix: event.network?.prefix ?? null,
    ip_version: event.network?.ip_version ?? null,
    affected_users: event.impact?.affected_users ?? null,
    affected_customers: event.impact?.affected_customers ?? null,
    affected_regions: event.impact?.affected_regions ?? null,
    impacted_services: event.impact?.impacted_services ?? null,
    started_at: event.started_at,
    updated_at: event.updated_at,
    resolved_at: event.resolved_at ?? null,
    title: event.title,
    summary: event.summary,
    raw_url: event.raw_url ?? null,
    raw_payload: event.raw_payload ?? null,
    dedupe_key: event.dedupe_key,
  };
}
