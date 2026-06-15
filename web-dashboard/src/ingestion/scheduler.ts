import type { NormalizedOutageEvent } from "./types";
import { upsertOutageEvents } from "./store";
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
    const events = await fetchStatusPageProvider(provider);
    sourceCounts[provider.provider] = events.length;
    allEvents.push(...events);
  }

  for (const source of PLACEHOLDER_SOURCES) {
    if (!source.isEnabled()) {
      sourceCounts[source.name] = 0;
      continue;
    }

    try {
      const events = await source.normalizeEvents();
      sourceCounts[source.name] = events.length;
      allEvents.push(...events);
    } catch (error) {
      sourceCounts[source.name] = 0;
      console.warn(`[ingestion] ${source.name} failed`, error);
    }
  }

  await upsertOutageEvents(allEvents);
  console.info(`[ingestion] stored ${allEvents.length} normalized outage events`);

  return {
    events: allEvents,
    source_counts: sourceCounts,
  };
}
