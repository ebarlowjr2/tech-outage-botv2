import type { NormalizedOutageEvent } from "./types";
import { recordIngestionRun, upsertOutageEvents } from "./store";
import { STATUSPAGE_PROVIDERS, fetchStatusPageProvider } from "./sources/statusPages";
import * as bgp from "./sources/bgp";
import * as cloudflareRadar from "./sources/cloudflareRadar";
import * as downdetector from "./sources/downdetector";
import * as electricityMaps from "./sources/electricityMaps";
import * as ioda from "./sources/ioda";
import * as ooni from "./sources/ooni";
import * as peeringDb from "./sources/peeringDb";
import * as powerOutage from "./sources/powerOutage";
import * as ripeAtlas from "./sources/ripeAtlas";
import * as statusGator from "./sources/statusGator";

type PlaceholderSource = {
  name: string;
  isEnabled: () => boolean;
  normalizeEvents: () => Promise<NormalizedOutageEvent[]>;
};

const PLACEHOLDER_SOURCES: PlaceholderSource[] = [
  { name: "IODA", ...ioda },
  { name: "Cloudflare Radar", ...cloudflareRadar },
  { name: "RIPE Atlas", ...ripeAtlas },
  { name: "BGP", ...bgp },
  { name: "OONI", ...ooni },
  { name: "PowerOutage.us", ...powerOutage },
  { name: "Electricity Maps", ...electricityMaps },
  { name: "Downdetector", ...downdetector },
  { name: "StatusGator", ...statusGator },
  { name: "PeeringDB", ...peeringDb },
];

export async function runOutageIngestionOnce(): Promise<{
  events: NormalizedOutageEvent[];
  source_counts: Record<string, number>;
}> {
  const allEvents: NormalizedOutageEvent[] = [];
  const sourceCounts: Record<string, number> = {};

  for (const provider of STATUSPAGE_PROVIDERS) {
    const startedAt = new Date().toISOString();

    try {
      const events = await fetchStatusPageProvider(provider);
      sourceCounts[provider.provider] = events.length;
      allEvents.push(...events);
      await recordIngestionRun({
        source: provider.provider,
        status: "ok",
        eventsCount: events.length,
        startedAt,
      });
    } catch (error) {
      sourceCounts[provider.provider] = 0;
      await recordIngestionRun({
        source: provider.provider,
        status: "error",
        eventsCount: 0,
        errorMessage: error instanceof Error ? error.message : "Unknown ingestion error",
        startedAt,
      });
    }
  }

  for (const source of PLACEHOLDER_SOURCES) {
    const startedAt = new Date().toISOString();

    if (!source.isEnabled()) {
      sourceCounts[source.name] = 0;
      await recordIngestionRun({
        source: source.name,
        status: "disabled",
        eventsCount: 0,
        errorMessage: "Missing API key or source not configured",
        startedAt,
      });
      continue;
    }

    try {
      const events = await source.normalizeEvents();
      sourceCounts[source.name] = events.length;
      allEvents.push(...events);
      await recordIngestionRun({
        source: source.name,
        status: "ok",
        eventsCount: events.length,
        startedAt,
      });
    } catch (error) {
      sourceCounts[source.name] = 0;
      console.warn(`[ingestion] ${source.name} failed`, error);
      await recordIngestionRun({
        source: source.name,
        status: "error",
        eventsCount: 0,
        errorMessage: error instanceof Error ? error.message : "Unknown ingestion error",
        startedAt,
      });
    }
  }

  await upsertOutageEvents(allEvents);
  console.info(`[ingestion] stored ${allEvents.length} normalized outage events`);

  return {
    events: allEvents,
    source_counts: sourceCounts,
  };
}
