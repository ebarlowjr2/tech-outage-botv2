import type { NormalizedOutageEvent, OutageEvent } from "../types";

export function isEnabled(): boolean {
  return Boolean(process.env.STATUSGATOR_API_KEY);
}

export async function fetchRawEvents(): Promise<unknown[]> {
  if (!isEnabled()) return [];

  // TODO:
  // Call the StatusGator API using STATUSGATOR_API_KEY once the account/API
  // contract is confirmed. Do not scrape StatusGator pages here.
  return [];
}

export async function fetchStatusGatorEvents(): Promise<OutageEvent[]> {
  if (!isEnabled()) return [];

  // TODO:
  // Normalize returned StatusGator incidents into OutageEvent records.
  // source = "StatusGator"
  // source_type = "aggregator"
  // confidence starts as medium when provider and status are clear.
  // confidence may become high only after official or measurement correlation.
  return [];
}

export async function normalizeEvents(): Promise<NormalizedOutageEvent[]> {
  return fetchStatusGatorEvents();
}
