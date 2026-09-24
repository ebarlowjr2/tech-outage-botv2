"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Incident, Severity } from "@/lib/types";
import type { PresenterState } from "@/src/types/realtime";
import { buildAnnouncement, buildOpeningReport, presenterStateForIncident } from "@/lib/presenterScript";

export interface PresenterSnapshot {
  state: PresenterState;
  caption: string | null;
  isSpeaking: boolean;
}

interface SpeechItem {
  key: string;
  text: string;
  state: PresenterState;
  priority: number; // lower = more urgent
}

interface UsePresenterOptions {
  /** Announce a rotating "situation report" when idle this long (ms). 0 disables. */
  heartbeatMs?: number;
  /** Max brand-new incidents announced per feed refresh (avoids floods). */
  maxPerRefresh?: number;
}

const SEVERITY_RANK: Record<Severity, number> = { critical: 0, major: 1, minor: 2, info: 3 };
const GAP_BETWEEN_MS = 700;

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

function isAnnounceable(incident: Incident) {
  return incident.isResolved !== true && incident.isActive !== false && incident.isMaintenance !== true;
}

/** Roughly how long a line takes to read, used when audio is unavailable. */
function estimateDurationMs(text: string) {
  return Math.max(3500, Math.min(15000, text.length * 55));
}

/**
 * Drives the on-air presenter: dedupes new incidents from the live feed,
 * turns them into spoken lines, plays TTS audio (falling back to silent
 * captions when TTS is unavailable), and exposes robot/caption state.
 */
export function usePresenter(
  incidents: Incident[],
  activeCount: number,
  options: UsePresenterOptions = {},
): PresenterSnapshot {
  const { heartbeatMs = 5 * 60_000, maxPerRefresh = 3 } = options;

  const [snapshot, setSnapshot] = useState<PresenterSnapshot>({
    state: "IDLE",
    caption: null,
    isSpeaking: false,
  });

  const queueRef = useRef<SpeechItem[]>([]);
  const seenRef = useRef<Set<string>>(new Set());
  const seededRef = useRef(false);
  const runningRef = useRef(false);
  const tokenRef = useRef(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const activeCountRef = useRef(activeCount);
  const heartbeatSeedRef = useRef(1);

  useEffect(() => {
    activeCountRef.current = activeCount;
  }, [activeCount]);

  const playItem = useCallback(async (item: SpeechItem) => {
    const token = ++tokenRef.current;
    setSnapshot({ state: item.state, caption: item.text, isSpeaking: true });

    const fallbackMs = estimateDurationMs(item.text);
    let objectUrl: string | null = null;

    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: item.text }),
      });

      if (token !== tokenRef.current) return; // superseded while awaiting

      if (res.ok) {
        const blob = await res.blob();
        if (token !== tokenRef.current) return;
        objectUrl = URL.createObjectURL(blob);
        const audio = new Audio(objectUrl);
        audioRef.current = audio;

        await new Promise<void>((resolve) => {
          let settled = false;
          const done = () => {
            if (settled) return;
            settled = true;
            resolve();
          };
          audio.onended = done;
          audio.onerror = done;
          audio.play().catch(() => {
            // Autoplay blocked (e.g. a human viewing without interaction) —
            // keep the caption/robot animated for the estimated read time.
            setTimeout(done, fallbackMs);
          });
        });
      } else {
        // No key / upstream error: silent caption for the read time.
        await sleep(fallbackMs);
      }
    } catch {
      await sleep(fallbackMs);
    } finally {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      if (audioRef.current) audioRef.current = null;
    }

    if (token !== tokenRef.current) return;
    setSnapshot({ state: "IDLE", caption: null, isSpeaking: false });
  }, []);

  const pump = useCallback(async () => {
    if (runningRef.current) return;
    runningRef.current = true;
    try {
      while (queueRef.current.length > 0) {
        queueRef.current.sort((a, b) => a.priority - b.priority);
        const item = queueRef.current.shift()!;
        await playItem(item);
        await sleep(GAP_BETWEEN_MS);
      }
    } finally {
      runningRef.current = false;
      setSnapshot((prev) => (prev.isSpeaking ? prev : { state: "IDLE", caption: null, isSpeaking: false }));
    }
  }, [playItem]);

  const enqueue = useCallback(
    (item: SpeechItem) => {
      queueRef.current.push(item);
      void pump();
    },
    [pump],
  );

  // Watch the live feed for new incidents.
  useEffect(() => {
    const announceable = incidents.filter(isAnnounceable);

    if (!seededRef.current) {
      seededRef.current = true;
      announceable.forEach((incident) => seenRef.current.add(incident.id));

      enqueue({
        key: "opening",
        text: buildOpeningReport(activeCount, 0),
        state: "TALKING",
        priority: 5,
      });

      const top = [...announceable].sort(
        (a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity],
      )[0];
      if (top) {
        enqueue({
          key: top.id,
          text: buildAnnouncement(top),
          state: presenterStateForIncident(top),
          priority: 2 + SEVERITY_RANK[top.severity],
        });
      }
      return;
    }

    const fresh = announceable
      .filter((incident) => !seenRef.current.has(incident.id))
      .sort((a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity])
      .slice(0, maxPerRefresh);

    fresh.forEach((incident) => {
      seenRef.current.add(incident.id);
      enqueue({
        key: incident.id,
        text: buildAnnouncement(incident),
        state: presenterStateForIncident(incident),
        priority: 2 + SEVERITY_RANK[incident.severity],
      });
    });
  }, [incidents, activeCount, enqueue, maxPerRefresh]);

  // Idle "situation report" so a quiet channel is never silent for long.
  useEffect(() => {
    if (heartbeatMs <= 0) return;
    const timer = window.setInterval(() => {
      if (runningRef.current || queueRef.current.length > 0) return;
      enqueue({
        key: `heartbeat-${Date.now()}`,
        text: buildOpeningReport(activeCountRef.current, heartbeatSeedRef.current++),
        state: "TALKING",
        priority: 6,
      });
    }, heartbeatMs);
    return () => window.clearInterval(timer);
  }, [heartbeatMs, enqueue]);

  // Stop audio on unmount.
  useEffect(() => {
    return () => {
      tokenRef.current++;
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  return snapshot;
}
