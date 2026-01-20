"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { createClient } from "@/src/lib/realtimeClient";
import { classifyEvent } from "@/src/lib/classifyEvent";
import { useEventDirector } from "@/src/lib/useEventDirector";
import { mapIncidentRow, Incident, SupabaseIncidentRow } from "@/src/lib/mappers";
import dynamic from 'next/dynamic';
import { Activity, AlertTriangle, CheckCircle, Globe, Server, Radio } from 'lucide-react';

// Dynamic import for Map to avoid SSR issues
const CyberMap = dynamic(() => import('./components/CyberMap'), {
  ssr: false,
  loading: () => <div className="w-full h-full flex items-center justify-center text-cyan-500/50 animate-pulse">CONNECTING...</div>
});

import SystemPresenter from "./components/SystemPresenter";
import SubtitleBar from "./components/SubtitleBar";

function StatusBadge({ s }: { s: Incident["severity"] }) {
  const color = s === "good" ? "var(--lime)" : s === "warn" ? "var(--amber)" : "var(--rose)";
  const label = s === "good" ? "NORMAL" : s === "warn" ? "DEGRADED" : "OUTAGE";
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border border-white/10 bg-white/5 text-[10px] font-bold tracking-wider" style={{ color: color, borderColor: `${color}40` }}>
      <span className="w-1.5 h-1.5 rounded-full bg-current shadow-[0_0_8px_currentColor]" />
      {label}
    </span>
  );
}

export default function Page() {
  const supabase = useMemo(() => createClient(), []);
  const [incidents, setIncidents] = useState<Incident[]>([]);

  // Event Director - centralized choreography
  const director = useEventDirector({
    displayDurationMs: 8000,
  });

  // Initial data load
  useEffect(() => {
    async function fetchIncidents() {
      const { data } = await supabase
        .from('incidents')
        .select(`
          *,
          providers ( name )
        `)
        .eq('active', true)
        .order('last_update', { ascending: false });

      if (data) {
        setIncidents(data.map((row) => mapIncidentRow(row as SupabaseIncidentRow)));
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

  const activeCounts = useMemo(() => {
    const bad = incidents.filter(i => i.severity === "bad").length;
    const warn = incidents.filter(i => i.severity === "warn").length;
    const ok = incidents.filter(i => i.severity === "good" || i.severity === undefined).length;
    return { bad, warn, ok };
  }, [incidents]);

  // ticker text
  const ticker = useMemo(() => {
    const items = incidents.map(i => `${i.provider}: ${i.title} (${i.status})`);
    return items.length ? items.join("  ///  ") : "ALL SYSTEMS OPERATIONAL  ///  MONITORING ACTIVE";
  }, [incidents]);

  return (
    <div className="relative min-h-screen overflow-hidden text-[color:var(--text)]">
      {/* Background handled by globals.css body */}

      {/* Presenter Overlay - now fed by Event Director */}
      <SystemPresenter
        presenterState={director.presenterState}
        subtitleText={director.subtitleText}
        captionText={director.captionText}
        isSpeaking={director.isSpeaking}
        lastSpokenAt={director.lastSpokenAt}
      />

      {/* Subtitle Bar (TV-style bottom overlay) */}
      <SubtitleBar
        text={director.captionText}
        isSpeaking={director.isSpeaking}
      />

      <div className="relative mx-auto max-w-[1600px] px-6 py-8 h-screen flex flex-col gap-6">

        {/* Header & KPI Row */}
        <div className="flex items-end justify-between gap-6 shrink-0">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-2 h-2 bg-[color:var(--cyan)] rounded-full animate-pulse" />
              <div className="text-xs tracking-[0.3em] font-bold text-[color:var(--cyan)] opacity-80">LIVE • GLOBAL AVAILABILITY</div>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
              TECH OUTAGE <span className="text-[color:var(--cyan)]">WATCH</span>
            </h1>
          </div>

          <div className="flex items-center gap-4">
            {/* Major Outages Tile */}
            <div className="card px-5 py-3 min-w-[160px] flex items-center justify-between group hover:border-[color:var(--rose)] transition-colors">
              <div>
                <div className="text-[10px] tracking-widest text-[color:var(--muted)] font-bold mb-1">MAJOR OUTAGES</div>
                <div className="text-3xl font-bold text-[color:var(--rose)]">{activeCounts.bad}</div>
              </div>
              <AlertTriangle className="w-6 h-6 text-[color:var(--rose)] opacity-50 group-hover:opacity-100 transition-opacity" />
            </div>

            {/* Degradation Tile */}
            <div className="card px-5 py-3 min-w-[160px] flex items-center justify-between group hover:border-[color:var(--amber)] transition-colors">
              <div>
                <div className="text-[10px] tracking-widest text-[color:var(--muted)] font-bold mb-1">DEGRADED</div>
                <div className="text-3xl font-bold text-[color:var(--amber)]">{activeCounts.warn}</div>
              </div>
              <Activity className="w-6 h-6 text-[color:var(--amber)] opacity-50 group-hover:opacity-100 transition-opacity" />
            </div>

            {/* Operational Tile */}
            <div className="card px-5 py-3 min-w-[160px] flex items-center justify-between group hover:border-[color:var(--lime)] transition-colors">
              <div>
                <div className="text-[10px] tracking-widest text-[color:var(--muted)] font-bold mb-1">OPERATIONAL</div>
                <div className="text-3xl font-bold text-[color:var(--lime)]">{activeCounts.ok}</div>
              </div>
              <CheckCircle className="w-6 h-6 text-[color:var(--lime)] opacity-50 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-12 gap-6 flex-1 min-h-0">

          {/* Map Panel */}
          <div className="col-span-12 lg:col-span-8 card card-accent relative flex flex-col p-1 overflow-hidden group">
            {/* Map Overlay Header */}
            <div className="absolute top-5 left-5 z-[400] flex items-center gap-3">
              <div className="bg-black/60 backdrop-blur px-3 py-1.5 rounded-full border border-white/10 flex items-center gap-2">
                <Globe className="w-3 h-3 text-[color:var(--cyan)]" />
                <span className="text-xs font-bold tracking-widest text-white/90">LIVE MAP</span>
              </div>
              <div className="text-[10px] font-mono text-white/40">Last Updated: Just now</div>
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
                  <div key={i.id} className="p-3 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.06] hover:border-white/10 transition-all group cursor-default">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        {/* Provider Logo Mark */}
                        <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-xs font-bold text-white/80">
                          {i.provider.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-white/90 group-hover:text-[color:var(--cyan)] transition-colors">{i.provider}</div>
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
                {/* Fake Signal Bar */}
                <div className="h-1 bg-white/10 rounded-full mt-2 overflow-hidden flex gap-0.5">
                  <div className="flex-1 bg-[color:var(--cyan)] opacity-20" />
                  <div className="flex-1 bg-[color:var(--cyan)] opacity-40" />
                  <div className="flex-1 bg-[color:var(--cyan)] opacity-60" />
                  <div className="flex-1 bg-[color:var(--cyan)] opacity-80" />
                  <div className="flex-1 bg-[color:var(--cyan)]" />
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
