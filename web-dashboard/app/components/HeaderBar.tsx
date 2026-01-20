"use client";

import { AlertTriangle, Activity, CheckCircle, Wifi, WifiOff } from "lucide-react";

// Connection status type
type ConnectionStatus = "LIVE" | "RECONNECTING" | "OFFLINE";

export type HeaderBarProps = {
    activeCounts: {
        bad: number;
        warn: number;
        ok: number;
    };
    connectionStatus?: ConnectionStatus;
    presenterLabel?: string; // e.g. "NOC BOT • STANDING BY"
    lastUpdatedLabel?: string; // e.g. "Last updated: Just now"
};

export default function HeaderBar({
    activeCounts,
    connectionStatus = "LIVE",
    presenterLabel = "NOC BOT • STANDING BY",
    lastUpdatedLabel = "Last updated: —",
}: HeaderBarProps) {
    // Connection status styling
    const connectionStyles = {
        LIVE: {
            color: "var(--lime)",
            label: "LIVE",
            icon: Wifi,
            animate: true,
        },
        RECONNECTING: {
            color: "var(--amber)",
            label: "RECONNECTING",
            icon: Wifi,
            animate: true,
        },
        OFFLINE: {
            color: "var(--rose)",
            label: "OFFLINE",
            icon: WifiOff,
            animate: false,
        },
    };

    const connStyle = connectionStyles[connectionStatus];
    const ConnIcon = connStyle.icon;

    return (
        <header className="shrink-0">
            {/* Row 1: Brand + KPIs */}
            <div className="grid grid-cols-12 items-center gap-3 sm:gap-4">
                {/* Brand block */}
                <div className="col-span-12 lg:col-span-6">
                    <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
                        {/* Connection Status Indicator */}
                        <div className="flex items-center gap-1.5 sm:gap-2">
                            <div 
                                className={`w-2 h-2 rounded-full ${connStyle.animate ? "animate-pulse" : ""}`}
                                style={{ backgroundColor: connStyle.color, boxShadow: `0 0 8px ${connStyle.color}` }}
                            />
                            <ConnIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5" style={{ color: connStyle.color }} />
                        </div>
                        <div 
                            className="text-[10px] sm:text-xs tracking-[0.2em] sm:tracking-[0.3em] font-bold opacity-90"
                            style={{ color: connStyle.color }}
                        >
                            {connStyle.label}
                        </div>
                        <span className="text-white/30 text-[10px] sm:text-xs">•</span>
                        <div className="text-[10px] sm:text-xs tracking-[0.2em] sm:tracking-[0.3em] font-bold text-[color:var(--cyan)] opacity-80">
                            GLOBAL AVAILABILITY
                        </div>
                    </div>

                    {/* Clamp sizes to prevent 720p overlap */}
                    <h1 className="font-bold tracking-tight text-white flex items-baseline gap-1.5 sm:gap-2 leading-[1.05] text-[clamp(22px,2.4vw,40px)]">
                        TECH OUTAGE <span className="text-[color:var(--cyan)]">WATCH</span>
                    </h1>
                </div>

                {/* KPI tiles */}
                <div className="col-span-12 lg:col-span-6">
                    <div className="flex flex-wrap items-center justify-start lg:justify-end gap-2 sm:gap-3">
                        {/* Major Outages Tile */}
                        <div className="card kpi-tile kpi-tile-rose px-3 sm:px-4 py-2 sm:py-3 min-w-[100px] sm:min-w-[130px] flex flex-col gap-1.5 sm:gap-2 group hover:-translate-y-0.5 hover:shadow-2xl transition-all cursor-default">
                            <div className="flex items-center justify-between gap-2">
                                <div>
                                    <div className="text-[9px] sm:text-[10px] tracking-widest text-[color:var(--muted)] font-bold mb-0.5 sm:mb-1">
                                        OUTAGES
                                    </div>
                                    <div className="font-bold text-[color:var(--rose)] leading-none text-[clamp(18px,2vw,30px)] tabular-nums">
                                        {activeCounts.bad}
                                    </div>
                                </div>
                                <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 text-[color:var(--rose)] opacity-50 group-hover:opacity-100 transition-opacity shrink-0" />
                            </div>
                        </div>

                        {/* Degradation Tile */}
                        <div className="card kpi-tile kpi-tile-amber px-3 sm:px-4 py-2 sm:py-3 min-w-[100px] sm:min-w-[130px] flex flex-col gap-1.5 sm:gap-2 group hover:-translate-y-0.5 hover:shadow-2xl transition-all cursor-default">
                            <div className="flex items-center justify-between gap-2">
                                <div>
                                    <div className="text-[9px] sm:text-[10px] tracking-widest text-[color:var(--muted)] font-bold mb-0.5 sm:mb-1">
                                        DEGRADED
                                    </div>
                                    <div className="font-bold text-[color:var(--amber)] leading-none text-[clamp(18px,2vw,30px)] tabular-nums">
                                        {activeCounts.warn}
                                    </div>
                                </div>
                                <Activity className="w-5 h-5 sm:w-6 sm:h-6 text-[color:var(--amber)] opacity-50 group-hover:opacity-100 transition-opacity shrink-0" />
                            </div>
                        </div>

                        {/* Operational Tile */}
                        <div className="card kpi-tile kpi-tile-lime px-3 sm:px-4 py-2 sm:py-3 min-w-[100px] sm:min-w-[130px] flex flex-col gap-1.5 sm:gap-2 group hover:-translate-y-0.5 hover:shadow-2xl transition-all cursor-default">
                            <div className="flex items-center justify-between gap-2">
                                <div>
                                    <div className="text-[9px] sm:text-[10px] tracking-widest text-[color:var(--muted)] font-bold mb-0.5 sm:mb-1">
                                        OPERATIONAL
                                    </div>
                                    <div className="font-bold text-[color:var(--lime)] leading-none text-[clamp(18px,2vw,30px)] tabular-nums">
                                        {activeCounts.ok}
                                    </div>
                                </div>
                                <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-[color:var(--lime)] opacity-50 group-hover:opacity-100 transition-opacity shrink-0" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Row 2: Status strip (prevents stacking) - single source of truth for status labels */}
            <div className="mt-2 sm:mt-3 card px-3 sm:px-4 py-1.5 sm:py-2 flex flex-wrap items-center justify-between gap-2 sm:gap-3">
                <div className="flex items-center gap-2 sm:gap-3 text-sm flex-wrap">
                    {/* Live Capsule Identity */}
                    <div className="live-capsule animate-shimmer">
                        <div className="live-dot" />
                        <span className="text-[10px] sm:text-[11px] tracking-[0.12em] sm:tracking-[0.18em] text-white/70">
                            Monitoring: AWS • GCP • GitHub • PyPI
                        </span>
                    </div>

                    {/* Presenter Status - hidden on very small screens to prevent collision */}
                    <span className="hidden sm:inline-flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[color:var(--lime)]" />
                        <span className="tracking-[0.18em] sm:tracking-[0.22em] text-[color:var(--muted)] uppercase text-[10px] sm:text-[11px] font-bold">
                            {presenterLabel}
                        </span>
                    </span>
                </div>

                <div className="text-[10px] sm:text-[11px] tracking-[0.12em] sm:tracking-[0.18em] text-[color:var(--muted)] font-bold uppercase">
                    {lastUpdatedLabel}
                </div>
            </div>
        </header>
    );
}
