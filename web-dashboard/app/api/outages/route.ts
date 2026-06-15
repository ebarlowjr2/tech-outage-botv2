import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/src/ingestion/db";
import type { ConfidenceLevel, NormalizedOutageEvent, OutageCategory, OutageStatus, Severity } from "@/src/ingestion/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type OutageEventRow = {
  event_id: string;
  source: string;
  source_type: NormalizedOutageEvent["source_type"];
  category: OutageCategory;
  provider: string | null;
  service: string | null;
  status: OutageStatus;
  severity: Severity;
  confidence: ConfidenceLevel;
  confidence_score: number;
  country: string | null;
  region: string | null;
  city: string | null;
  lat: number | null;
  lon: number | null;
  asn: string | null;
  as_name: string | null;
  prefix: string | null;
  ip_version: "ipv4" | "ipv6" | null;
  affected_users: number | null;
  affected_customers: number | null;
  affected_regions: string[] | null;
  impacted_services: string[] | null;
  started_at: string;
  updated_at: string;
  resolved_at: string | null;
  title: string;
  summary: string;
  raw_url: string | null;
  raw_payload: unknown;
  dedupe_key: string;
  created_at: string;
};

type FilterableQuery = {
  in: (column: string, values: string[]) => FilterableQuery;
};

const severityRank: Record<Severity, number> = {
  critical: 4,
  major: 3,
  minor: 2,
  info: 1,
};

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const filters = Object.fromEntries(searchParams.entries());
  const statusFilter = searchParams.get("status") || "active";
  const since = searchParams.get("since") || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  try {
    const supabase = createServerSupabaseClient();
    let query = supabase.from("outage_events").select("*").gte("updated_at", since);

    if (statusFilter === "active") {
      query = query.not("status", "in", "(resolved,maintenance)");
    } else if (statusFilter === "resolved") {
      query = query.eq("status", "resolved");
    }

    query = applyInFilter(query, "category", searchParams.get("category"));
    query = applyInFilter(query, "confidence", searchParams.get("confidence"));
    query = applyInFilter(query, "severity", searchParams.get("severity"));

    if (searchParams.get("country")) {
      query = query.eq("country", searchParams.get("country"));
    }

    if (!searchParams.get("confidence")) {
      query = query.neq("confidence", "low");
    }

    const { data, error } = await query.limit(200);

    if (error) {
      throw error;
    }

    const events = ((data ?? []) as OutageEventRow[]).map(toNormalizedOutageEvent).sort(sortEvents);

    return NextResponse.json({
      events,
      meta: {
        count: events.length,
        generated_at: new Date().toISOString(),
        filters: {
          status: statusFilter,
          since,
          ...filters,
        },
      },
    });
  } catch (error) {
    console.error("[api/outages] failed", error);
    return NextResponse.json(
      {
        events: [],
        meta: {
          count: 0,
          generated_at: new Date().toISOString(),
          filters,
        },
        error: "Failed to load outage events",
      },
      { status: 500 },
    );
  }
}

function applyInFilter<TQuery extends FilterableQuery>(query: TQuery, column: string, value: string | null): TQuery {
  if (!value) return query;
  const values = value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  if (!values.length) return query;
  return query.in(column, values) as TQuery;
}

function toNormalizedOutageEvent(row: OutageEventRow): NormalizedOutageEvent {
  return {
    event_id: row.event_id,
    source: row.source,
    source_type: row.source_type,
    category: row.category,
    provider: row.provider ?? undefined,
    service: row.service ?? undefined,
    status: row.status,
    severity: row.severity,
    confidence: row.confidence,
    confidence_score: Number(row.confidence_score),
    location: {
      country: row.country ?? undefined,
      region: row.region ?? undefined,
      city: row.city ?? undefined,
      lat: row.lat ?? undefined,
      lon: row.lon ?? undefined,
    },
    network: {
      asn: row.asn ?? undefined,
      as_name: row.as_name ?? undefined,
      prefix: row.prefix ?? undefined,
      ip_version: row.ip_version ?? undefined,
    },
    impact: {
      affected_users: row.affected_users ?? undefined,
      affected_customers: row.affected_customers ?? undefined,
      affected_regions: row.affected_regions ?? undefined,
      impacted_services: row.impacted_services ?? undefined,
    },
    started_at: row.started_at,
    updated_at: row.updated_at,
    resolved_at: row.resolved_at,
    title: row.title,
    summary: row.summary,
    raw_url: row.raw_url ?? undefined,
    raw_payload: row.raw_payload,
    dedupe_key: row.dedupe_key,
    created_at: row.created_at,
  };
}

function sortEvents(a: NormalizedOutageEvent, b: NormalizedOutageEvent) {
  return (
    b.confidence_score - a.confidence_score ||
    severityRank[b.severity] - severityRank[a.severity] ||
    new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  );
}
