export type ProviderLocation = {
  country: string;
  region: string;
  city: string;
  lat: number;
  lon: number;
};

export const PROVIDER_LOCATIONS: Record<string, ProviderLocation> = {
  Cloudflare: {
    country: "US",
    region: "Global Network",
    city: "Global",
    lat: 37.7749,
    lon: -122.4194,
  },
  GitHub: {
    country: "US",
    region: "North America",
    city: "San Francisco",
    lat: 37.7749,
    lon: -122.4194,
  },
  Slack: {
    country: "US",
    region: "North America",
    city: "San Francisco",
    lat: 37.7749,
    lon: -122.4194,
  },
  Zoom: {
    country: "US",
    region: "North America",
    city: "San Jose",
    lat: 37.3382,
    lon: -121.8863,
  },
  Stripe: {
    country: "US",
    region: "North America",
    city: "San Francisco",
    lat: 37.7749,
    lon: -122.4194,
  },
  Twilio: {
    country: "US",
    region: "North America",
    city: "San Francisco",
    lat: 37.7749,
    lon: -122.4194,
  },
  DigitalOcean: {
    country: "US",
    region: "North America",
    city: "New York",
    lat: 40.7128,
    lon: -74.006,
  },
  Fastly: {
    country: "US",
    region: "Global Network",
    city: "San Francisco",
    lat: 37.7749,
    lon: -122.4194,
  },
};

export function getProviderLocation(provider?: string) {
  return provider ? PROVIDER_LOCATIONS[provider] : undefined;
}
