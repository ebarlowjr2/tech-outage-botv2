export type LonLat = { lon: number; lat: number };

export const PROVIDER_DEFAULTS: Record<string, LonLat> = {
  aws: { lon: -77.4875, lat: 39.0438 },      // Northern Virginia-ish
  gcp: { lon: -122.084, lat: 37.422 },       // Mountain View-ish
  github: { lon: -122.3321, lat: 47.6062 },  // Seattle-ish
  pypi: { lon: -74.006, lat: 40.7128 },      // NYC-ish (neutral)
  cloudflare: { lon: -122.4194, lat: 37.7749 }, // SF-ish
  azure: { lon: -122.1215, lat: 47.6740 },   // Redmond-ish
  "test-net": { lon: -95.7129, lat: 37.0902 }, // Center of US for test provider
};

export const REGION_HINTS: Record<string, LonLat> = {
  "us-east-1": { lon: -77.4875, lat: 39.0438 },
  "us-east-2": { lon: -82.9988, lat: 39.9612 }, // Ohio
  "us-west-1": { lon: -121.4944, lat: 38.5816 }, // N. California
  "us-west-2": { lon: -122.6765, lat: 45.5231 }, // Portland-ish
  "eu-west-1": { lon: -6.2603, lat: 53.3498 },   // Dublin
  "eu-west-2": { lon: -0.1276, lat: 51.5074 },   // London
  "eu-central-1": { lon: 8.6821, lat: 50.1109 }, // Frankfurt
  "ap-southeast-1": { lon: 103.8198, lat: 1.3521 }, // Singapore
  "ap-southeast-2": { lon: 151.2093, lat: -33.8688 }, // Sydney
  "ap-northeast-1": { lon: 139.6917, lat: 35.6895 }, // Tokyo
  "ap-south-1": { lon: 72.8777, lat: 19.0760 }, // Mumbai
  "sa-east-1": { lon: -46.6333, lat: -23.5505 }, // Sao Paulo
};

// Fallback location (center of Atlantic Ocean - neutral)
export const FALLBACK_LOCATION: LonLat = { lon: -30, lat: 20 };
