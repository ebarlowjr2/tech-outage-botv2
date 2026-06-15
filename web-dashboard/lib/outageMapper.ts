import type { Incident } from "./types";
import type { NormalizedOutageEvent } from "@/src/ingestion/types";

const statusLabel: Record<NormalizedOutageEvent["status"], Incident["status"]> = {
  investigating: "Investigating",
  identified: "Identified",
  monitoring: "Monitoring",
  degraded: "Investigating",
  partial_outage: "Identified",
  major_outage: "Investigating",
  resolved: "Resolved",
  maintenance: "Monitoring",
  unknown: "Investigating",
};

const fallbackCoords = {
  internet: { lat: 20, lng: 0 },
  cloud: { lat: 39.04, lng: -77.49 },
  cellular: { lat: 40.71, lng: -74.01 },
  telecom: { lat: 41.88, lng: -87.63 },
  satellite: { lat: 47.61, lng: -122.33 },
  power: { lat: 30.27, lng: -97.74 },
  data_center: { lat: 37.77, lng: -122.42 },
  cdn: { lat: 50.11, lng: 8.68 },
  dns: { lat: 37.42, lng: -122.08 },
  bgp: { lat: 52.52, lng: 13.4 },
  saas: { lat: 37.78, lng: -122.39 },
  unknown: { lat: 20, lng: 0 },
};

export function mapOutageEventToIncident(event: NormalizedOutageEvent): Incident {
  const coords = fallbackCoords[event.category] ?? fallbackCoords.unknown;
  const impactedServices = event.impact?.impacted_services?.length
    ? event.impact.impacted_services
    : ([event.service, event.category].filter(Boolean) as string[]);

  return {
    id: `${event.source}:${event.event_id}`,
    provider: event.provider || event.source,
    title: event.title,
    severity: event.severity,
    region: event.location.region || event.location.country || "global",
    lat: event.location.lat ?? coords.lat,
    lng: event.location.lon ?? coords.lng,
    timestamp: formatTimestamp(event.updated_at),
    status: statusLabel[event.status],
    category: event.category.replace("_", " "),
    summary: event.summary,
    impactedServices,
    updates: 1,
    confidence: event.confidence,
    confidenceScore: event.confidence_score,
    source: event.source,
    rawUrl: event.raw_url,
  };
}

function formatTimestamp(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
    timeZoneName: "short",
  }).format(new Date(value));
}
