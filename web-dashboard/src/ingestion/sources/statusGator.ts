import type { NormalizedOutageEvent } from "../types";

export function isEnabled(): boolean {
  return Boolean(process.env.STATUSGATOR_API_KEY);
}

export async function fetchRawEvents(): Promise<unknown[]> {
  return [];
}

export async function normalizeEvents(): Promise<NormalizedOutageEvent[]> {
  return [];
}
