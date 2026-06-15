import { calculateConfidenceScore } from "../confidence";
import { createDedupeKey, normalizeSeverity, normalizeStatus } from "../normalizers";
import type { NormalizedOutageEvent, OutageCategory } from "../types";

export type StatusPageProviderConfig = {
  provider: string;
  category: OutageCategory;
  baseUrl: string;
  sourceType: "official";
};

type StatusPageIncident = {
  id?: string;
  name?: string;
  status?: string;
  impact?: string;
  shortlink?: string;
  created_at?: string;
  started_at?: string;
  updated_at?: string;
  resolved_at?: string | null;
  incident_updates?: Array<{
    body?: string;
    status?: string;
    created_at?: string;
    updated_at?: string;
    affected_components?: Array<{
      name?: string;
      new_status?: string;
    }>;
  }>;
  components?: Array<{
    name?: string;
  }>;
};

type StatusPageResponse = {
  incidents?: StatusPageIncident[];
};

export const STATUSPAGE_PROVIDERS: StatusPageProviderConfig[] = [
  {
    provider: "Cloudflare",
    category: "cdn",
    baseUrl: "https://www.cloudflarestatus.com",
    sourceType: "official",
  },
  {
    provider: "GitHub",
    category: "saas",
    baseUrl: "https://www.githubstatus.com",
    sourceType: "official",
  },
  {
    provider: "Slack",
    category: "saas",
    baseUrl: "https://status.slack.com",
    sourceType: "official",
  },
  {
    provider: "Zoom",
    category: "saas",
    baseUrl: "https://status.zoom.us",
    sourceType: "official",
  },
  {
    provider: "Stripe",
    category: "saas",
    baseUrl: "https://status.stripe.com",
    sourceType: "official",
  },
  {
    provider: "Twilio",
    category: "telecom",
    baseUrl: "https://status.twilio.com",
    sourceType: "official",
  },
  {
    provider: "DigitalOcean",
    category: "cloud",
    baseUrl: "https://status.digitalocean.com",
    sourceType: "official",
  },
  {
    provider: "Fastly",
    category: "cdn",
    baseUrl: "https://status.fastly.com",
    sourceType: "official",
  },
];

export async function fetchStatusPageProvider(config: StatusPageProviderConfig): Promise<NormalizedOutageEvent[]> {
  const endpoint = `${config.baseUrl}/api/v2/incidents/unresolved.json`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);

  try {
    const response = await fetch(endpoint, {
      signal: controller.signal,
      headers: {
        accept: "application/json",
      },
      next: { revalidate: 60 },
    });

    if (!response.ok) {
      console.warn(`[ingestion] ${config.provider} statuspage returned ${response.status}`);
      return [];
    }

    const payload = (await response.json()) as StatusPageResponse;
    const incidents = payload.incidents ?? [];
    return incidents.map((incident) => normalizeStatusPageIncident(config, incident));
  } catch (error) {
    console.warn(`[ingestion] ${config.provider} statuspage failed`, error);
    return [];
  } finally {
    clearTimeout(timeout);
  }
}

function normalizeStatusPageIncident(
  config: StatusPageProviderConfig,
  incident: StatusPageIncident,
): NormalizedOutageEvent {
  const latestUpdate = incident.incident_updates?.[0];
  const now = new Date().toISOString();
  const status = normalizeStatus(`${incident.status ?? ""} ${latestUpdate?.status ?? ""}`);
  const severity = normalizeSeverity(`${incident.impact ?? ""} ${incident.name ?? ""} ${latestUpdate?.body ?? ""}`);
  const impactedServices = [
    ...compactStrings(incident.components?.map((component) => component.name)),
    ...compactStrings(latestUpdate?.affected_components?.map((component) => component.name)),
  ];

  const partialEvent: Partial<NormalizedOutageEvent> = {
    event_id: incident.id || `${config.provider}:${incident.name || now}`,
    source: `${config.provider} Statuspage`,
    source_type: config.sourceType,
    category: config.category,
    provider: config.provider,
    status,
    severity,
    location: {},
    impact: {
      impacted_services: [...new Set(impactedServices)],
    },
    started_at: incident.started_at || incident.created_at || latestUpdate?.created_at || now,
    updated_at: incident.updated_at || latestUpdate?.updated_at || now,
    resolved_at: incident.resolved_at ?? null,
    title: incident.name || `${config.provider} service incident`,
    summary: latestUpdate?.body || incident.name || "Official status page incident.",
    raw_url: incident.shortlink || config.baseUrl,
    raw_payload: incident,
    created_at: now,
  };

  const confidence = calculateConfidenceScore(partialEvent);
  const dedupe_key = createDedupeKey(partialEvent);

  return {
    ...(partialEvent as Omit<NormalizedOutageEvent, "confidence" | "confidence_score" | "dedupe_key">),
    ...confidence,
    dedupe_key,
  };
}

function compactStrings(values?: Array<string | undefined>): string[] {
  return values?.filter((value): value is string => Boolean(value)) ?? [];
}
