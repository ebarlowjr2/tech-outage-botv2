"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { divIcon } from "leaflet";

// Fix Leaflet default icon issues in Next.js
// (We are custom icons anyway, but good to have)

type Incident = {
    id: string;
    provider: string;
    title: string;
    severity: "good" | "warn" | "bad";
    region?: string; // e.g. "us-east-1"
    lat?: number;
    lon?: number;
};

// Region mapping (Simple lookup for v1)
const REGION_COORDS: Record<string, [number, number]> = {
    "us-east-1": [37.9268, -78.0249],
    "us-west-1": [37.3541, -121.9552],
    "us-west-2": [46.1580, -123.8818],
    "eu-west-1": [53.3498, -6.2603],
    "ap-northeast-1": [35.6895, 139.6917],
    "GLOBAL": [20, 0], // Middle of ocean or generic
};

// Custom Pulsing Icon
const createPulseIcon = (severity: string) => {
    const colorClass = severity === "bad" ? "bg-red-500 shadow-[0_0_20px_#ef4444]" :
        severity === "warn" ? "bg-yellow-500 shadow-[0_0_15px_#eab308]" :
            "bg-teal-400 shadow-[0_0_10px_#2dd4bf]";

    return divIcon({
        className: "custom-pin",
        html: `<div class="relative w-4 h-4 rounded-full ${colorClass} border border-white/50">
             <div class="absolute inset-0 rounded-full animate-ping opacity-75 ${colorClass}"></div>
           </div>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8],
    });
};

export default function CyberMap({ incidents }: { incidents: Incident[] }) {
    // Filter for incidents that have a region we can map
    // If 'region' prop is missing or not in lookup, we can try to "hash" it just to put it somewhere or ignore.
    // For v1, fallback to Global 0,0 if unknown

    const mapCenter: [number, number] = [20, 0];

    return (
        <MapContainer
            center={mapCenter}
            zoom={2}
            scrollWheelZoom={false}
            className="w-full h-full rounded-xl bg-[#05070d] z-0"
            zoomControl={false}
        >
            {/* Dark Matter Tiles */}
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            />

            {incidents.map((inc) => {
                // Try to find coords
                const coords = REGION_COORDS[inc.region || "GLOBAL"] || REGION_COORDS["GLOBAL"];
                // Add random jitter so they don't stack perfectly
                const jitterLat = coords[0] + (Math.random() - 0.5) * 2;
                const jitterLon = coords[1] + (Math.random() - 0.5) * 5;

                return (
                    <Marker
                        key={inc.id}
                        position={[jitterLat, jitterLon]}
                        icon={createPulseIcon(inc.severity)}
                    >
                        <Popup className="glass-popup">
                            <div className="bg-gray-900 text-white p-2 rounded border border-blue-500/30 text-xs">
                                <strong className="block text-blue-300">{inc.provider}</strong>
                                {inc.title}
                            </div>
                        </Popup>
                    </Marker>
                );
            })}
        </MapContainer>
    );
}
