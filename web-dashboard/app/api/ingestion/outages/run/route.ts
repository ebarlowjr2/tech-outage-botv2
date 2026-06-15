import { NextRequest, NextResponse } from "next/server";
import { runOutageIngestionOnce } from "@/src/ingestion/scheduler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const secret = process.env.INGESTION_SECRET;

  if (!secret) {
    return NextResponse.json({ error: "INGESTION_SECRET is not configured" }, { status: 500 });
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runOutageIngestionOnce();
    return NextResponse.json({
      ok: true,
      stored: result.events.length,
      source_counts: result.source_counts,
      generated_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[ingestion] run failed", error);
    return NextResponse.json({ error: "Outage ingestion failed" }, { status: 500 });
  }
}
