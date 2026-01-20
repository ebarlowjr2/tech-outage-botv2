"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { createClient } from "@/src/lib/realtimeClient";
import { classifyEvent } from "@/src/lib/classifyEvent";
import { useEventDirector } from "@/src/lib/useEventDirector";
import { mapIncidentRow, Incident, SupabaseIncidentRow } from "@/src/lib/mappers";
import dynamic from 'next/dynamic';
import { Globe, Server, Radio, Activity, ShieldCheck } from 'lucide-react';

// Connection status type
type ConnectionStatus = "LIVE" | "RECONNECTING" | "OFFLINE";

// Number of monitored services (AWS, GCP, GitHub, PyPI)
const MONITORED_SERVICES_COUNT = 4;

// Dynamic import for Map to avoid SSR issues
const CyberMap = dynamic(() => import('./components/CyberMap'), {
  ssr: false,
  loading: () => <div className="w-full h-full flex items-center justify-center text-cyan-500/50 animate-pulse">INITIALIZING MAP...</div>
});

import SubtitleBar from "./components/SubtitleBar";
import HeaderBar from "./components/HeaderBar";

// Status Badge using design system chip classes
function StatusBadge({ s }: { s: Incident["severity"] }) {
  const chipClass = s === "good" ? "chip chip-ok" : s === "warn" ? "chip chip-warn" : "chip chip-bad";
  const label = s === "good" ? "NORMAL" : s === "warn" ? "DEGRADED" : "OUTAGE";
  return (
    <span className={chipClass}>
      <span className="status-dot status-dot-pulse" style={{ backgroundColor: "currentColor" }} />
      {label}
    </span>
  );
}

export default function Page() {
  const supabase = useMemo(() => createClient(), []);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("RECONNECTING");
  const [hasReceivedData, setHasReceivedData] = useState(false);

  // Event Director - centralized choreography
  const director = useEventDirector({
    displayDurationMs: 8000,
  });

  // Initial data load
  useEffect(() => {
    async function fetchIncidents() {
      try {
        const { data, error } = await supabase
          .from('incidents')
          .select(`
            *,
            providers ( name )
          `)
          .eq('active', true)
          .order('last_update', { ascending: false });

        if (error) {
          setConnectionStatus("OFFLINE");
          return;
        }

        if (data) {
          setIncidents(data.map((row) => mapIncidentRow(row as SupabaseIncidentRow)));
          setHasReceivedData(true);
          setConnectionStatus("LIVE");
        }
      } catch {
        setConnectionStatus("OFFLINE");
      }
    }

    fetchIncidents();
  }, [supabase]);

  // Centralized realtime subscriptions (SINGLE SOURCE OF TRUTH)
  useEffect(() => {
    // 1. Incidents channel
    const incidentsChannel = supabase
      .channel('realtime-incidents')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'incidents' }, (payload) => {
        // Update dashboard state
        const row = payload.new as SupabaseIncidentRow;
        if (row) {
          const mapped = mapIncidentRow(row);

          setIncidents((prev) => {
            const idx = prev.findIndex((x) => x.id === row.id);
            if (idx === -1) return [mapped, ...prev];
            const next = [...prev];
            next[idx] = mapped;
            return next;
          });
        }

        // Mark as live when receiving data
        setConnectionStatus("LIVE");
        setHasReceivedData(true);

        // Enqueue for presenter
        const evt = classifyEvent({ table: 'incidents', payload });
        if (evt) director.enqueue(evt);
      })
      .subscribe();

    // 2. Incident events channel (captions from bot)
    const incidentEventsChannel = supabase
      .channel('presenter-alerts')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'incident_events' }, (payload) => {
        const evt = classifyEvent({ table: 'incident_events', payload });
        if (evt) director.enqueue(evt);
      })
      .subscribe();

    // 3. Producer events channel (manual announcements)
    const producerEventsChannel = supabase
      .channel('producer-alerts')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'producer_events' }, (payload) => {
        const evt = classifyEvent({ table: 'producer_events', payload });
        if (evt) director.enqueue(evt);
      })
      .subscribe();

    // 4. Internet conditions channel
    const internetChannel = supabase
      .channel('internet-conditions')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'internet_conditions' }, (payload) => {
        const evt = classifyEvent({ table: 'internet_conditions', payload });
        if (evt) director.enqueue(evt);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(incidentsChannel);
      supabase.removeChannel(incidentEventsChannel);
      supabase.removeChannel(producerEventsChannel);
      supabase.removeChannel(internetChannel);
    };
  }, [supabase, director]);

  // KPI counts - Fixed semantics: Operational = monitored services OK
  const activeCounts = useMemo(() => {
    const bad = incidents.filter(i => i.severity === "bad").length;
    const warn = incidents.filter(i => i.severity === "warn").length;
    // Operational = monitored services minus those with issues
    // When all services are OK, show the count of monitored services (4)
    const servicesWithIssues = bad + warn;
    const ok = servicesWithIssues === 0 ? MONITORED_SERVICES_COUNT : Math.max(0, MONITORED_SERVICES_COUNT - servicesWithIssues);
    return { bad, warn, ok };
  }, [incidents]);

  // ticker text
  const ticker = useMemo(() => {
    const items = incidents.map(i => `${i.provider}: ${i.title} (${i.status})`);
    return items.length ? items.join("  ///  ") : "ALL SYSTEMS OPERATIONAL  ///  MONITORING ACTIVE";
  }, [incidents]);

  // Last updated label - shows meaningful text based on data state
  const lastUpdatedLabel = useMemo(() => {
    if (!hasReceivedData) {
      return "Waiting for first ingest...";
    }
    if (incidents.length > 0) {
      const latest = new Date(incidents[0].updatedAt);
      const now = new Date();
      const diffMs = now.getTime() - latest.getTime();
      const diffMins = Math.floor(diffMs / 60000);

      if (diffMins < 1) return "Last updated: Just now";
      if (diffMins < 60) return `Last updated: ${diffMins}m ago`;
      return `Last updated: ${Math.floor(diffMins / 60)}h ago`;
    }
    return "All systems operational";
  }, [incidents, hasReceivedData]);

  return (
    <div className="relative min-h-screen overflow-hidden text-[color:var(--text)]">
      {/* Background handled by globals.css body */}

      {/* Subtitle Bar (TV-style bottom overlay) - positioned above ticker */}
      <SubtitleBar
        text={director.captionText}
        isSpeaking={director.isSpeaking}
      />

      {/* AppFrame: Fixed layout contract */}
      <div className="relative mx-auto max-w-[1600px] px-6 py-6 h-screen flex flex-col">

        {/* HeaderBar: Fixed height (140px min), no overlap */}
        <div className="shrink-0" style={{ minHeight: '140px' }}>
          <HeaderBar
            activeCounts={activeCounts}
            connectionStatus={connectionStatus}
            presenterLabel={`NOC BOT • ${director.presenterState === "IDLE" ? "STANDING BY" : director.presenterState}`}
            lastUpdatedLabel={lastUpdatedLabel}
          />
        </div>

        {/* MainContent: Starts BELOW header with padding */}
        <div className="flex-1 min-h-0 pt-4">
          <div className="grid grid-cols-12 gap-6 h-full">

            {/* Map Panel */}
            <div className="col-span-12 lg:col-span-8 card card-accent relative flex flex-col p-1 overflow-hidden group">
              {/* Map Overlay Header - using map-chip class */}
              <div className="absolute top-5 left-5 z-[400] flex items-center gap-3">
                <div className="map-chip">
                  <Globe className="w-3.5 h-3.5 text-[color:var(--cyan)]" />
                  <span className="text-xs font-bold tracking-widest text-white/90">LIVE MAP</span>
                </div>

                <div className="map-chip bg-black/40">
                  <span className="text-[11px] tracking-[0.22em] text-white/60 uppercase font-bold">
                    Service Health
                  </span>
                </div>
              </div>

              {/* Map Component */}
              <div className="flex-1 rounded-xl overflow-hidden bg-[#05070d] relative">
                <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] pointer-events-none mix-blend-overlay" />
                <CyberMap incidents={incidents} />
              </div>
            </div>

            {/* Right Column: Feed */}
            <div className="col-span-12 lg:col-span-4 flex flex-col gap-6 overflow-hidden">

              {/* Feed Card */}
              <div className="card card-accent flex-1 flex flex-col min-h-0">
                <div className="p-4 border-b border-white/5 flex items-center justify-between">
                  <div className="text-xs tracking-[0.2em] font-bold text-[color:var(--muted)] flex items-center gap-2">
                    <Radio className="w-3 h-3" />
                    LIVE FEED
                  </div>
                  <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded text-white/40">{incidents.length} Events</span>
                </div>

                <div className="p-3 space-y-3 overflow-y-auto flex-1 custom-scrollbar">
                  {incidents.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-[color:var(--muted)] opacity-50 gap-3">
                      <Server className="w-8 h-8 opacity-20" />
                      <span className="text-xs tracking-widest">NO ACTIVE OUTAGES</span>
                    </div>
                  )}

                  {incidents.map(i => (
                    <div key={i.id} className="feed-item group">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          {/* Provider Badge */}
                          <div className="provider-badge shrink-0">
                            {i.provider.substring(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-bold text-white/90 group-hover:text-[color:var(--cyan)] transition-colors truncate">{i.provider}</div>
                            <div className="text-[10px] font-mono text-white/40">#{i.id.slice(0, 4)}</div>
                          </div>
                        </div>
                        <StatusBadge s={i.severity} />
                      </div>
                      <div className="mt-2 text-xs text-[color:var(--muted)] leading-relaxed pl-[44px]">
                        {i.title}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* System Status / Signature Element */}
              <div className="card p-4 shrink-0">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-[10px] tracking-widest text-[color:var(--muted)] font-bold">SYSTEM INTEGRITY</div>
                  <div className="w-1.5 h-1.5 rounded-full bg-[color:var(--lime)] shadow-[0_0_8px_var(--lime)]" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-mono text-white/40">
                    <span>DATA_INGEST</span>
                    <span className="text-[color:var(--lime)]">OPTIMAL</span>
                  </div>
                  <div className="flex justify-between text-xs font-mono text-white/40">
                    <span>NEURAL_VOICE</span>
                    <span className="text-[color:var(--cyan)]">READY</span>
                  </div>
                  {/* Signal Bars */}
                  <div className="signal-bars mt-2">
                    <div className="signal-bar opacity-20" />
                    <div className="signal-bar opacity-40" />
                    <div className="signal-bar opacity-60" />
                    <div className="signal-bar opacity-80" />
                    <div className="signal-bar" />
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Ticker Bottom */}
        <div className="card h-10 mt-auto shrink-0 flex items-center overflow-hidden bg-black/60 backdrop-blur-md border-0 border-t border-white/5">
          <div className="px-5 h-full flex items-center bg-[color:var(--rose)]/10 border-r border-white/5 text-[color:var(--rose)] text-[10px] font-bold tracking-widest z-10 gap-2">
            <div className="w-1.5 h-1.5 bg-current rounded-full animate-pulse" />
            BREAKING
          </div>
          <div className="flex-1 relative h-full flex items-center overflow-hidden">
            <motion.div
              className="absolute whitespace-nowrap text-xs font-mono font-medium text-[color:var(--text)] opacity-80"
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
