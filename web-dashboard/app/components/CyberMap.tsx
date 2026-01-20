"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { divIcon } from "leaflet";

type Incident = {
    id: string;
    provider: string;
    title: string;
    severity: "good" | "warn" | "bad";
    region?: string;
    lat?: number;
    lon?: number;
};

// Region mapping
const REGION_COORDS: Record<string, [number, number]> = {
    "us-east-1": [37.9268, -78.0249],
    "us-west-1": [37.3541, -121.9552],
    "us-west-2": [46.1580, -123.8818],
    "eu-west-1": [53.3498, -6.2603],
    "ap-northeast-1": [35.6895, 139.6917],
    "GLOBAL": [20, 0],
};

// Monitoring Nodes (Always visible in Blue/Idle)
const MONITORING_NODES = [
    { id: "va", lat: 39.0438, lon: -77.4874, label: "US East (N. Virginia)" },
    { id: "or", lat: 45.8399, lon: -119.7006, label: "US West (Oregon)" },
    { id: "fra", lat: 50.1109, lon: 8.6821, label: "EU (Frankfurt)" },
    { id: "lon", lat: 51.5074, lon: -0.1278, label: "EU (London)" },
    { id: "tyo", lat: 35.6762, lon: 139.6503, label: "Asia (Tokyo)" },
    { id: "syd", lat: -33.8688, lon: 151.2093, label: "Oceania (Sydney)" },
];

const createMonitorIcon = () => {
    return divIcon({
        className: "monitor-pin",
        html: `<div class="w-2 h-2 bg-cyan-500/30 rounded-full relative">
             <div class="absolute inset-0 bg-cyan-400 rounded-full animate-ping opacity-20 duration-[3000ms]"></div>
           </div>`,
        iconSize: [8, 8],
        iconAnchor: [4, 4],
    });
};

// Custom Outage Icon (Only for active incidents)
const createOutageIcon = (severity: string) => {
    const colorClass = severity === "bad" ? "bg-red-500 shadow-[0_0_20px_#ef4444]" :
        "bg-yellow-500 shadow-[0_0_15px_#eab308]";

    return divIcon({
        className: "outage-pin",
        html: `<div class="relative w-4 h-4 rounded-full ${colorClass} border border-white/80 z-10">
             <div class="absolute inset-0 rounded-full animate-ping opacity-75 ${colorClass}"></div>
           </div>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8],
    });
};

export default function CyberMap({ incidents }: { incidents: Incident[] }) {
    const mapCenter: [number, number] = [20, 0];

    return (
        <MapContainer
            center={mapCenter}
            zoom={2}
            scrollWheelZoom={false}
            className="w-full h-full rounded-xl bg-[#05070d] z-0"
            zoomControl={false}
            dragging={false}
            doubleClickZoom={false}
            attributionControl={false}
        >
            {/* Dark Matter Tiles (Clean/NoLabels) */}
            <TileLayer
                url="https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png"
            />

            {/* 1. Render Monitoring Nodes (Idle) */}
            {MONITORING_NODES.map((node) => (
                <Marker
                    key={node.id}
                    position={[node.lat, node.lon]}
                    icon={createMonitorIcon()}
                />
            ))}

            {/* 2. Render Active Incidents (Outages) */}
            {incidents.map((inc) => {
                // Try to find coords - default to 0,0 if unknown
                const coords = REGION_COORDS[inc.region || "GLOBAL"] || [0, 0];

                // Skip if Global (0,0) or unknown, effectively hiding non-geo alerts from map 
                // (Decision: Keep map clean, only show regional outages)
                if (coords[0] === 0 && coords[1] === 0) return null;

                // Add random jitter
                const jitterLat = coords[0] + (Math.random() - 0.5) * 2;
                const jitterLon = coords[1] + (Math.random() - 0.5) * 5;

                return (
                    <Marker
                        key={inc.id}
                        position={[jitterLat, jitterLon]}
                        icon={createOutageIcon(inc.severity)}
                    >
                        <Popup className="glass-popup" closeButton={false}>
                            <div className="bg-gray-900/90 backdrop-blur text-white p-2 rounded border border-red-500/30 text-xs shadow-xl">
                                <strong className="block text-red-300 mb-1 tracking-widest text-[10px]">{inc.provider.toUpperCase()}</strong>
                                {inc.title}
                            </div>
                        </Popup>
                    </Marker>
                );
            })}
        </MapContainer>
    );
}
