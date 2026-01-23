import { LonLat, PROVIDER_DEFAULTS, REGION_HINTS, FALLBACK_LOCATION } from "./geoProviders";

export interface IncidentWithGeo {
  id: string;
  provider: string;
  regions?: string[];
  geo_lon?: number | null;
  geo_lat?: number | null;
}

/**
 * Resolve incident location by priority:
 * 1. If incident has geo coords -> use it
 * 2. Else if incident has regions[] -> use first matching region hint
 * 3. Else use provider default
 * 4. Else fallback to "global neutral"
 */
export function incidentToLonLat(incident: IncidentWithGeo): LonLat {
  // Priority 1: Direct geo coordinates
  if (incident.geo_lon != null && incident.geo_lat != null) {
    return { lon: incident.geo_lon, lat: incident.geo_lat };
  }

  // Priority 2: Region hints
  if (incident.regions && incident.regions.length > 0) {
    for (const region of incident.regions) {
      const regionLower = region.toLowerCase();
      if (REGION_HINTS[regionLower]) {
        return REGION_HINTS[regionLower];
      }
    }
  }

  // Priority 3: Provider default
  const providerKey = incident.provider.toLowerCase().replace(/[^a-z0-9-]/g, "");
  if (PROVIDER_DEFAULTS[providerKey]) {
    return PROVIDER_DEFAULTS[providerKey];
  }

  // Priority 4: Fallback
  return FALLBACK_LOCATION;
}

/**
 * Get severity color for Cesium rendering
 */
export function getSeverityColor(severity: string): { r: number; g: number; b: number; a: number } {
  switch (severity) {
    case "bad":
    case "major":
    case "outage":
      return { r: 255, g: 90, b: 120, a: 255 }; // Rose/Red
    case "warn":
    case "degraded":
    case "minor":
      return { r: 255, g: 200, b: 80, a: 255 }; // Amber
    case "good":
    case "operational":
    case "info":
    default:
      return { r: 90, g: 240, b: 255, a: 255 }; // Cyan
  }
}
