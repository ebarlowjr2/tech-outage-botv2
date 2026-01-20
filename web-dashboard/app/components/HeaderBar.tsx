"use client";

import { AlertTriangle, Activity, CheckCircle } from "lucide-react";

export type HeaderBarProps = {
    activeCounts: {
        bad: number;
        warn: number;
        ok: number;
    };
    // Add these two so we stop stacking text in random places
    presenterLabel?: string; // e.g. "NOC BOT • STANDING BY"
    lastUpdatedLabel?: string; // e.g. "Last updated: Just now"
};

export default function HeaderBar({
    activeCounts,
    presenterLabel = "NOC BOT • STANDING BY",
    lastUpdatedLabel = "Last updated: —",
}: HeaderBarProps) {
    return (
        <header className="shrink-0">
            {/* Row 1: Brand + KPIs */}
            <div className="grid grid-cols-12 items-center gap-4">
                {/* Brand block */}
                <div className="col-span-12 lg:col-span-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-2 h-2 bg-[color:var(--cyan)] rounded-full animate-pulse" />
                        <div className="text-xs tracking-[0.3em] font-bold text-[color:var(--cyan)] opacity-80">
                            LIVE • GLOBAL AVAILABILITY
                        </div>
                    </div>

                    {/* Clamp sizes to prevent 720p overlap */}
                    <h1 className="font-bold tracking-tight text-white flex items-baseline gap-2 leading-[1.05] text-[clamp(26px,2.6vw,44px)]">
                        TECH OUTAGE <span className="text-[color:var(--cyan)]">WATCH</span>
                    </h1>
                </div>

                {/* KPI tiles */}
                <div className="col-span-12 lg:col-span-6">
                    <div className="flex flex-wrap items-center justify-start lg:justify-end gap-3">
                        {/* Major Outages Tile */}
                        <div className="card px-4 py-3 min-w-[150px] flex items-center justify-between gap-4 group hover:border-[color:var(--rose)] transition-colors">
                            <div>
                                <div className="text-[10px] tracking-widest text-[color:var(--muted)] font-bold mb-1">
                                    MAJOR OUTAGES
                                </div>
                                <div className="font-bold text-[color:var(--rose)] leading-none text-[clamp(22px,2.2vw,34px)]">
                                    {activeCounts.bad}
                                </div>
                            </div>
                            <AlertTriangle className="w-6 h-6 text-[color:var(--rose)] opacity-50 group-hover:opacity-100 transition-opacity" />
                        </div>

                        {/* Degradation Tile */}
                        <div className="card px-4 py-3 min-w-[150px] flex items-center justify-between gap-4 group hover:border-[color:var(--amber)] transition-colors">
                            <div>
                                <div className="text-[10px] tracking-widest text-[color:var(--muted)] font-bold mb-1">
                                    DEGRADED
                                </div>
                                <div className="font-bold text-[color:var(--amber)] leading-none text-[clamp(22px,2.2vw,34px)]">
                                    {activeCounts.warn}
                                </div>
                            </div>
                            <Activity className="w-6 h-6 text-[color:var(--amber)] opacity-50 group-hover:opacity-100 transition-opacity" />
                        </div>

                        {/* Operational Tile */}
                        <div className="card px-4 py-3 min-w-[150px] flex items-center justify-between gap-4 group hover:border-[color:var(--lime)] transition-colors">
                            <div>
                                <div className="text-[10px] tracking-widest text-[color:var(--muted)] font-bold mb-1">
                                    OPERATIONAL
                                </div>
                                <div className="font-bold text-[color:var(--lime)] leading-none text-[clamp(22px,2.2vw,34px)]">
                                    {activeCounts.ok}
                                </div>
                            </div>
                            <CheckCircle className="w-6 h-6 text-[color:var(--lime)] opacity-50 group-hover:opacity-100 transition-opacity" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Row 2: Status strip (prevents stacking) */}
            <div className="mt-3 card px-4 py-2 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3 text-sm">
                    <span className="inline-flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[color:var(--lime)]" />
                        <span className="tracking-[0.22em] text-[color:var(--muted)] uppercase text-[11px] font-bold">
                            {presenterLabel}
                        </span>
                    </span>
                </div>

                <div className="text-[11px] tracking-[0.18em] text-[color:var(--muted)] font-bold uppercase">
                    {lastUpdatedLabel}
                </div>
            </div>
        </header>
    );
}
