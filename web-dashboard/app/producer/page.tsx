"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Activity, Radio, ShieldAlert, Mic, Lock } from "lucide-react";

export default function ProducerPage() {
    const [password, setPassword] = useState("");
    const [authenticated, setAuthenticated] = useState(false);

    // Producer State
    const [simProvider, setSimProvider] = useState("TEST-NET");
    const [simTitle, setSimTitle] = useState("Simulated Latency Spike");
    const [simSeverity, setSimSeverity] = useState("warn");
    const [announcement, setAnnouncement] = useState("");
    const [contextStatus, setContextStatus] = useState("stable");

    // Auth Check (Simple)
    const checkAuth = () => {
        // In real app, verify via API. Here simple gate.
        if (password === (process.env.NEXT_PUBLIC_PRODUCER_PASSWORD || "admin123")) {
            setAuthenticated(true);
        } else {
            alert("Access Denied");
        }
    };

    // 1. TRIGGER OUTAGE
    const triggerOutage = async () => {
        const { data: prov } = await supabase.from('providers').select('id').eq('name', simProvider).single();
        let providerId = prov?.id;

        // Auto-create provider if missing for tests
        if (!providerId) {
            const { data: newProv } = await supabase.from('providers').insert({ name: simProvider }).select().single();
            providerId = newProv.id;
        }

        const payload = {
            provider_id: providerId,
            title: simTitle,
            severity: simSeverity,
            status: "Investigating",
            active: true,
            last_update: new Date().toISOString()
        };

        await supabase.from('incidents').insert(payload);

        // Log Event
        await supabase.from('producer_events').insert({
            type: 'SIM_OUTAGE',
            payload: payload,
            created_by: 'producer'
        });

        alert("Outage Injected");
    };

    // 2. SET CONTEXT
    const setContext = async (status: string) => {
        await supabase.from('internet_conditions').insert({
            status: status,
            description: status === 'stable' ? 'Global routing stable' : 'Elevated routing instability observed',
            last_updated: new Date().toISOString()
        });
        setContextStatus(status);

        // Log
        await supabase.from('producer_events').insert({
            type: 'CONTEXT_SET',
            payload: { status },
            created_by: 'producer'
        });
    };

    // 3. ANNOUNCE
    const announce = async () => {
        if (!announcement) return;

        // We insert into incident_events as a "System Message" (no incident_id or special one)
        // Or we use a special event type the frontend listens to?
        // Frontend listens to "incident_events" table. 
        // Let's create a fake incident ID for "System" or just insert a global event.
        // Hack: Insert event with NULL incident_id if schema allows, or use a "SYSTEM" provider incident.

        // Better: The NOC BOT listens for this! 
        // Wait, SystemPresenter listens to incident_events INSERT.
        // We need to insert a row there.

        // Let's ensure a "SYSTEM" incident exists to attach to?
        // Or simplified: Just Log it and update Frontend to listen to 'producer_events' too?
        // Plan said: "Frontend watches producer_events in realtime".
        // I need to update SystemPresenter to watch producer_events too!

        await supabase.from('producer_events').insert({
            type: 'ANNOUNCE',
            payload: { message: announcement },
            created_by: 'producer'
        });

        setAnnouncement("");
        alert("Announcement Sent");
    };

    if (!authenticated) {
        return (
            <div className="h-full flex items-center justify-center bg-black text-white">
                <div className="card p-8 max-w-sm w-full space-y-4">
                    <div className="flex items-center gap-2 text-[color:var(--cyan)] mb-4">
                        <Lock className="w-6 h-6" />
                        <h1 className="font-bold tracking-widest">PRODUCER ACCESS</h1>
                    </div>
                    <input
                        type="password"
                        className="w-full bg-white/5 border border-white/10 rounded p-2 text-white"
                        placeholder="Enter Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    <button onClick={checkAuth} className="w-full bg-[color:var(--cyan)] text-black font-bold py-2 rounded hover:opacity-80">
                        UNLOCK
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full overflow-auto bg-[#05070d] text-white p-8">
            <div className="max-w-4xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">PRODUCER CONSOLE</h1>
                        <p className="text-[color:var(--muted)] text-sm font-mono">LIVE CONTROL OVERRIDE</p>
                    </div>
                    <div className="px-3 py-1 bg-red-500/20 text-red-500 text-xs font-bold rounded border border-red-500/50 animate-pulse">
                        LIVE PRODUCTION ACTIVE
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                    {/* SIMULATE OUTAGE */}
                    <div className="card p-6 space-y-4 bg-red-950/10 border-red-500/20">
                        <div className="flex items-center gap-2 text-red-400 font-bold tracking-widest text-sm">
                            <ShieldAlert className="w-4 h-4" /> INJECT OUTAGE
                        </div>
                        <div className="space-y-3">
                            <input className="w-full bg-black/40 border border-white/10 p-2 rounded text-sm" placeholder="Provider (e.g. AWS)" value={simProvider} onChange={e => setSimProvider(e.target.value)} />
                            <input className="w-full bg-black/40 border border-white/10 p-2 rounded text-sm" placeholder="Title (e.g. API Failure)" value={simTitle} onChange={e => setSimTitle(e.target.value)} />
                            <select className="w-full bg-black/40 border border-white/10 p-2 rounded text-sm text-gray-400" value={simSeverity} onChange={e => setSimSeverity(e.target.value)}>
                                <option value="warn">Warn (Degraded)</option>
                                <option value="bad">Bad (Outage)</option>
                            </select>
                            <button onClick={triggerOutage} className="w-full bg-red-600/20 border border-red-600 text-red-500 font-bold py-2 rounded hover:bg-red-600 hover:text-white transition-all">
                                EXECUTE SIMULATION
                            </button>
                        </div>
                    </div>

                    {/* CONTEXT CONTROL */}
                    <div className="card p-6 space-y-4">
                        <div className="flex items-center gap-2 text-[color:var(--amber)] font-bold tracking-widest text-sm">
                            <Activity className="w-4 h-4" /> INTERNET CONTEXT
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <button onClick={() => setContext('stable')} className={`p-4 rounded border text-center transition-all ${contextStatus === 'stable' ? 'bg-[color:var(--lime)]/20 border-[color:var(--lime)] text-[color:var(--lime)]' : 'bg-white/5 border-white/10 text-gray-500'}`}>
                                STABLE
                            </button>
                            <button onClick={() => setContext('unstable')} className={`p-4 rounded border text-center transition-all ${contextStatus === 'unstable' ? 'bg-[color:var(--amber)]/20 border-[color:var(--amber)] text-[color:var(--amber)]' : 'bg-white/5 border-white/10 text-gray-500'}`}>
                                UNSTABLE
                            </button>
                        </div>
                    </div>

                    {/* ANNC */}
                    <div className="card p-6 space-y-4 col-span-1 md:col-span-2 bg-[color:var(--cyan)]/5 border-[color:var(--cyan)]/20">
                        <div className="flex items-center gap-2 text-[color:var(--cyan)] font-bold tracking-widest text-sm">
                            <Radio className="w-4 h-4" /> MANUAL ANNOUNCEMENT (TTS)
                        </div>
                        <div className="flex gap-4">
                            <textarea
                                className="flex-1 bg-black/40 border border-white/10 p-3 rounded text-sm focus:border-[color:var(--cyan)] outline-none"
                                rows={2}
                                placeholder="Type message for Presenter to speak..."
                                value={announcement}
                                onChange={e => setAnnouncement(e.target.value)}
                            />
                            <button onClick={announce} className="px-6 bg-[color:var(--cyan)] text-black font-bold rounded hover:opacity-90 flex items-center gap-2">
                                <Mic className="w-4 h-4" /> SPEAK
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
