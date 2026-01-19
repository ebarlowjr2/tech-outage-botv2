"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";

type Incident = {
  id: string;
  provider: string;
  title: string;
  severity: "good" | "warn" | "bad";
  region?: string;
  updatedAt: string;
};

const demo: Incident[] = [
  { id: "1", provider: "AWS", title: "No active incidents", severity: "good", region: "GLOBAL", updatedAt: new Date().toISOString() },
  { id: "2", provider: "GitHub", title: "No active incidents", severity: "good", region: "GLOBAL", updatedAt: new Date().toISOString() },
];

function SeverityPill({ s }: { s: Incident["severity"] }) {
  const cls = s === "good" ? "badge-good" : s === "warn" ? "badge-warn" : "badge-bad";
  const label = s === "good" ? "NORMAL" : s === "warn" ? "DEGRADED" : "OUTAGE";
  return (
    <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs tracking-widest ${cls}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
      {label}
    </span>
  );
}

export default function Page() {
  // TODO: replace with Supabase realtime incidents
  const [incidents, setIncidents] = useState<Incident[]>(demo);

  const activeCounts = useMemo(() => {
    const bad = incidents.filter(i => i.severity === "bad").length;
    const warn = incidents.filter(i => i.severity === "warn").length;
    const ok = incidents.filter(i => i.severity === "good").length;
    return { bad, warn, ok };
  }, [incidents]);

  // ticker text
  const ticker = useMemo(() => {
    const items = incidents.map(i => `${i.provider}: ${i.title} (${i.region ?? "—"})`);
    return items.length ? items.join("  •  ") : "Standing by for telemetry…";
  }, [incidents]);

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="cyber-grid absolute inset-0" />
      <div className="relative mx-auto max-w-[1400px] px-5 py-6">
        {/* Top bar */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-xs tracking-[0.35em] text-[color:var(--muted)]">LIVE • TECH OUTAGE COMMAND</div>
            <div className="text-2xl font-semibold">Cyber Outage Tracker Y’all</div>
          </div>
          <div className="flex items-center gap-3">
            <div className="kpi px-4 py-2">
              <div className="text-[11px] tracking-[0.25em] text-[color:var(--muted)]">ACTIVE OUTAGES</div>
              <div className="text-lg font-semibold">{activeCounts.bad}</div>
            </div>
            <div className="kpi px-4 py-2">
              <div className="text-[11px] tracking-[0.25em] text-[color:var(--muted)]">DEGRADED</div>
              <div className="text-lg font-semibold">{activeCounts.warn}</div>
            </div>
            <div className="kpi px-4 py-2">
              <div className="text-[11px] tracking-[0.25em] text-[color:var(--muted)]">NORMAL</div>
              <div className="text-lg font-semibold">{activeCounts.ok}</div>
            </div>
          </div>
        </div>

        {/* Main grid */}
        <div className="mt-6 grid grid-cols-12 gap-5">
          {/* Map/scene panel */}
          <div className="col-span-12 lg:col-span-8 glass glow-edge p-4 min-h-[560px]">
            <div className="flex items-center justify-between">
              <div className="text-sm tracking-[0.22em] text-[color:var(--muted)]">THREATMAP VIEW</div>
              <div className="text-xs text-[color:var(--muted)]">AU/NOC projection • simulated</div>
            </div>

            {/* Placeholder map container */}
            <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 h-[500px] relative overflow-hidden">
              <div className="absolute inset-0 opacity-70"
                style={{
                  backgroundImage:
                    "radial-gradient(circle at 30% 30%, rgba(90,240,255,0.22), transparent 35%), radial-gradient(circle at 70% 40%, rgba(190,110,255,0.18), transparent 38%), radial-gradient(circle at 45% 70%, rgba(50,255,180,0.16), transparent 40%)"
                }}
              />
              {/* Pulses */}
              <motion.div
                className="absolute left-[18%] top-[35%] w-3 h-3 rounded-full bg-[color:var(--bad)]"
                animate={{ boxShadow: ["0 0 0 0 rgba(255,90,120,0.0)", "0 0 0 18px rgba(255,90,120,0.12)", "0 0 0 0 rgba(255,90,120,0.0)"] }}
                transition={{ duration: 2.2, repeat: Infinity }}
              />
              <motion.div
                className="absolute left-[62%] top-[46%] w-3 h-3 rounded-full bg-[color:var(--warn)]"
                animate={{ boxShadow: ["0 0 0 0 rgba(255,200,80,0.0)", "0 0 0 16px rgba(255,200,80,0.12)", "0 0 0 0 rgba(255,200,80,0.0)"] }}
                transition={{ duration: 2.6, repeat: Infinity, delay: 0.4 }}
              />

              <div className="absolute bottom-3 left-3 text-xs text-[color:var(--muted)]">
                Replace this panel with MapLibre/Deck.gl and plot incidents by region lat/lon.
              </div>
            </div>
          </div>

          {/* Right column */}
          <div className="col-span-12 lg:col-span-4 grid gap-5">
            {/* Robot presenter */}
            <div className="glass glow-edge p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm tracking-[0.22em] text-[color:var(--muted)]">PRESENTER</div>
                <span className="text-xs text-[color:var(--muted)]">BOT STATUS: IDLE</span>
              </div>
              <div className="mt-4 flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl border border-white/10 bg-gradient-to-br from-cyan-400/20 to-purple-400/10 flex items-center justify-center">
                  <span className="text-lg">🤖</span>
                </div>
                <div className="flex-1">
                  <div className="text-lg font-semibold">N.O.C. BOT</div>
                  <div className="text-sm text-[color:var(--muted)]">Standing by for new incident telemetry.</div>
                </div>
              </div>

              <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-3 text-sm text-[color:var(--muted)]">
                Captions will appear here when TTS plays.
              </div>
            </div>

            {/* Incident list */}
            <div className="glass glow-edge p-4">
              <div className="text-sm tracking-[0.22em] text-[color:var(--muted)]">ACTIVE FEED</div>
              <div className="mt-3 space-y-3">
                {incidents.map(i => (
                  <div key={i.id} className="rounded-2xl border border-white/10 bg-black/20 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="font-semibold">{i.provider}</div>
                      <SeverityPill s={i.severity} />
                    </div>
                    <div className="mt-1 text-sm text-[color:var(--muted)]">{i.title}</div>
                    <div className="mt-2 text-xs text-white/45 flex justify-between">
                      <span>{i.region ?? "—"}</span>
                      <span>{new Date(i.updatedAt).toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick actions */}
            <div className="glass glow-edge p-4">
              <div className="text-sm tracking-[0.22em] text-[color:var(--muted)]">STREAM HEALTH</div>
              <div className="mt-3 text-sm text-[color:var(--muted)]">
                Add: bitrate target, last ingest time, OpenAI/TTS status, and “last spoken” timestamp.
              </div>
            </div>
          </div>
        </div>

        {/* Bottom ticker */}
        <div className="mt-5 glass glow-edge overflow-hidden">
          <div className="px-4 py-3 border-b border-white/10 text-xs tracking-[0.25em] text-[color:var(--muted)]">
            LIVE INCIDENT TICKER
          </div>
          <div className="relative h-10">
            <motion.div
              className="absolute whitespace-nowrap text-sm text-white/80 px-4"
              animate={{ x: ["100%", "-100%"] }}
              transition={{ duration: 28, repeat: Infinity, ease: "linear" }}
            >
              {ticker}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
