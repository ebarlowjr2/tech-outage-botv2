import type { NormalizedOutageEvent } from "../types";

export function isEnabled(): boolean {
  return false;
}

export async function fetchRawEvents(): Promise<unknown[]> {
  return [];
}

export async function normalizeEvents(): Promise<NormalizedOutageEvent[]> {
  return [];
}
