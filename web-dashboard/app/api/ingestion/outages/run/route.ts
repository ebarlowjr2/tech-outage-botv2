import { NextRequest, NextResponse } from "next/server";
import { runOutageIngestionOnce } from "@/src/ingestion/scheduler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function hasBearerSecret(request: NextRequest, secret?: string) {
  return Boolean(secret && request.headers.get("authorization") === `Bearer ${secret}`);
}

function hasIngestionSecret(request: NextRequest) {
  return hasBearerSecret(request, process.env.INGESTION_SECRET);
}

function hasCronSecret(request: NextRequest) {
  return hasBearerSecret(request, process.env.CRON_SECRET);
}

function isVercelCronRequest(request: NextRequest) {
  return request.headers.get("user-agent")?.toLowerCase().includes("vercel-cron") ?? false;
}

async function runIngestion() {
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

export async function GET(request: NextRequest) {
  if (!hasIngestionSecret(request) && !hasCronSecret(request) && !isVercelCronRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return runIngestion();
}

export async function POST(request: NextRequest) {
  if (!process.env.INGESTION_SECRET) {
    return NextResponse.json({ error: "INGESTION_SECRET is not configured" }, { status: 500 });
  }

  if (!hasIngestionSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return runIngestion();
}
