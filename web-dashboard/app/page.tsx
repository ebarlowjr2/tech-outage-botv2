"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabaseClient";
import dynamic from 'next/dynamic';
import RobotWidget from "./components/RobotWidget";

// Dynamic import for Map to avoid SSR issues
const CyberMap = dynamic(() => import('./components/CyberMap'), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-black/50 animate-pulse rounded-xl flex items-center justify-center text-cyan-500/50">INITIALIZING GEOSPATIAL UPLINK...</div>
});

type Incident = {
  id: string;
  provider: string; // We might need to join/fetch this, but for now lets assume flat or we fetch it
  title: string;
  severity: "good" | "warn" | "bad";
  status: string;
  region?: string;
  updatedAt: string;
  // Raw fields from DB might differ, we map them
};

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
  const [incidents, setIncidents] = useState<Incident[]>([]);

  // FETCH DATA
  useEffect(() => {
    fetchIncidents();

    const channel = supabase
      .channel('realtime-incidents')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'incidents' }, () => {
        fetchIncidents();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); }
  }, []);

  async function fetchIncidents() {
    // Join with providers table
    const { data, error } = await supabase
      .from('incidents')
      .select(`
        *,
        providers ( name )
      `)
      .eq('active', true)
      .order('last_update', { ascending: false });

    if (data) {
      const mapped = data.map((row: any) => ({
        id: row.id,
        provider: row.providers?.name || "Unknown",
        title: row.title,
        severity: row.severity === 'critical' ? 'bad' : row.severity === 'major' ? 'warn' : 'good',
        status: row.status,
        region: "GLOBAL", // Default for now until we join regions
        updatedAt: row.last_update
      }));
      setIncidents(mapped as Incident[]);
    }
  }

  const activeCounts = useMemo(() => {
    const bad = incidents.filter(i => i.severity === "bad").length;
    const warn = incidents.filter(i => i.severity === "warn").length;
    const ok = incidents.filter(i => i.severity === "good" || i.severity === undefined).length;
    return { bad, warn, ok };
  }, [incidents]);

  // ticker text
  const ticker = useMemo(() => {
    const items = incidents.map(i => `${i.provider}: ${i.title} (${i.status})`);
    return items.length ? items.join("  ///  ") : "NO ACTIVE THREATS DETECTED  ///  SYSTEMS NOMINAL";
  }, [incidents]);

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="cyber-grid absolute inset-0" />

      {/* Robot Overlay (Absolute) */}
      <RobotWidget />

      <div className="relative mx-auto max-w-[1600px] px-5 py-6 h-screen flex flex-col">
        {/* Top bar */}
        <div className="flex items-center justify-between gap-4 shrink-0">
          <div>
            <div className="text-xs tracking-[0.35em] text-[color:var(--muted)]">LIVE • TECH OUTAGE COMMAND</div>
            <div className="text-2xl font-semibold tracking-tight text-white/90">CYBERWATCH <span className="text-cyan-400">V2.0</span></div>
          </div>
          <div className="flex items-center gap-3">
            <div className="kpi px-4 py-2 min-w-[120px]">
              <div className="text-[10px] tracking-[0.2em] text-[color:var(--muted)] text-center">CRITICAL</div>
              <div className="text-2xl font-bold text-center text-red-500">{activeCounts.bad}</div>
            </div>
            <div className="kpi px-4 py-2 min-w-[120px]">
              <div className="text-[10px] tracking-[0.2em] text-[color:var(--muted)] text-center">DEGRADED</div>
              <div className="text-2xl font-bold text-center text-yellow-500">{activeCounts.warn}</div>
            </div>
            <div className="kpi px-4 py-2 min-w-[120px]">
              <div className="text-[10px] tracking-[0.2em] text-[color:var(--muted)] text-center">OPERATIONAL</div>
              <div className="text-2xl font-bold text-center text-teal-400">{activeCounts.ok}</div>
            </div>
          </div>
        </div>

        {/* Main grid (Flex grow to fill screen) */}
        <div className="mt-6 grid grid-cols-12 gap-5 flex-1 min-h-0">

          {/* Map/scene panel */}
          <div className="col-span-12 lg:col-span-8 glass glow-edge p-1 flex flex-col relative group">
            {/* Map Header Overlay */}
            <div className="absolute top-4 left-4 z-[400] bg-black/60 backdrop-blur px-3 py-1 rounded border border-white/10 pointer-events-none">
              <div className="text-xs tracking-[0.2em] text-cyan-400">GLOBAL THREAT MAP</div>
            </div>

            <div className="w-full h-full rounded-lg overflow-hidden relative bg-[#05070d]">
              <CyberMap incidents={incidents} />
            </div>
          </div>

          {/* Right column */}
          <div className="col-span-12 lg:col-span-4 flex flex-col gap-4 overflow-hidden">

            {/* Incident list */}
            <div className="glass glow-edge flex-1 flex flex-col min-h-0">
              <div className="p-4 border-b border-white/5 bg-white/5">
                <div className="text-xs tracking-[0.2em] text-[color:var(--muted)]">ACTIVE INCIDENTS ({incidents.length})</div>
              </div>
              <div className="p-2 space-y-2 overflow-y-auto flex-1">
                {incidents.length === 0 && (
                  <div className="h-full flex items-center justify-center text-white/20 text-sm tracking-widest animate-pulse">
                    NO ACTIVE SIGNALS
                  </div>
                )}
                {incidents.map(i => (
                  <div key={i.id} className="rounded border border-white/5 bg-black/40 p-3 hover:bg-white/5 transition-colors group">
                    <div className="flex items-center justify-between gap-3">
                      <div className="font-bold text-sm text-cyan-100 group-hover:text-cyan-400 transition-colors">{i.provider}</div>
                      <SeverityPill s={i.severity} />
                    </div>
                    <div className="mt-1 text-sm text-gray-400">{i.title}</div>
                    <div className="mt-2 text-xs text-white/30 flex justify-between font-mono">
                      <span>{i.updatedAt ? new Date(i.updatedAt).toLocaleTimeString() : 'Unknown'}</span>
                      <span>#{i.id.slice(0, 4)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick actions / Stream Status */}
            <div className="glass glow-edge p-4 shrink-0">
              <div className="text-xs tracking-[0.2em] text-[color:var(--muted)] mb-2">SYSTEM STATUS</div>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="bg-white/5 p-2 rounded text-center">
                  <div className="text-gray-500">INGEST</div>
                  <div className="text-green-400">ONLINE</div>
                </div>
                <div className="bg-white/5 p-2 rounded text-center">
                  <div className="text-gray-500">TTS ENGINE</div>
                  <div className="text-cyan-400">READY</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom ticker */}
        <div className="mt-4 glass glow-edge overflow-hidden shrink-0 h-10 flex items-center bg-black/60">
          <div className="px-4 h-full flex items-center border-r border-white/10 bg-red-500/10 text-red-400 text-xs font-bold tracking-widest z-10">
            BREAKING
          </div>
          <div className="flex-1 relative h-full flex items-center overflow-hidden">
            <motion.div
              className="absolute whitespace-nowrap text-sm font-mono text-cyan-50/80"
              animate={{ x: ["100%", "-100%"] }}
              transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
            >
              {ticker}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
