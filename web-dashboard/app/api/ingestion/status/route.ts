import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/src/ingestion/db";
import { STATUSPAGE_PROVIDERS } from "@/src/ingestion/sources/statusPages";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type IngestionRunRow = {
  source: string;
  status: "ok" | "error" | "disabled";
  events_count: number;
  error_message: string | null;
  started_at: string;
  completed_at: string | null;
};

const configuredSources = [
  ...STATUSPAGE_PROVIDERS.map((provider) => provider.provider),
  "IODA",
  "Cloudflare Radar",
  "RIPE Atlas",
  "BGP",
  "OONI",
  "PowerOutage.us",
  "Electricity Maps",
  "Downdetector",
  "StatusGator",
  "PeeringDB",
];

export async function GET() {
  try {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from("ingestion_runs")
      .select("source,status,events_count,error_message,started_at,completed_at")
      .order("started_at", { ascending: false })
      .limit(200);

    if (error) {
      throw error;
    }

    const rows = (data ?? []) as IngestionRunRow[];
    const latestBySource = new Map<string, IngestionRunRow>();

    for (const row of rows) {
      if (!latestBySource.has(row.source)) {
        latestBySource.set(row.source, row);
      }
    }

    const sources = configuredSources.map((source) => {
      const latest = latestBySource.get(source);

      return {
        source,
        status: latest?.status ?? "disabled",
        events_count: latest?.events_count ?? 0,
        last_run_at: latest?.completed_at ?? latest?.started_at ?? null,
        error_message: latest?.error_message ?? (latest ? null : "No ingestion run recorded yet"),
      };
    });

    return NextResponse.json({
      last_run_at: rows[0]?.completed_at ?? rows[0]?.started_at ?? null,
      sources,
    });
  } catch (error) {
    console.error("[api/ingestion/status] failed", error);
    return NextResponse.json(
      {
        last_run_at: null,
        sources: [],
        error: "Failed to load ingestion source status",
      },
      { status: 500 },
    );
  }
}
