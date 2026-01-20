// UI Design System Constants
export const UI = {
    // Spacing
    GAP: 16,
    CARD_PAD: 16,
    HEADER_H: 110,

    // Card System
    CARD_RADIUS: 18,
    CARD_BORDER: 'rgba(255, 255, 255, 0.08)',
    CARD_BLUR: 14,
    CARD_SHADOW: '0 18px 45px rgba(0, 0, 0, 0.45)',

    // Typography
    BODY_LINE_HEIGHT: 1.4,
    HEADING_LINE_HEIGHT: 1.1,

    // Colors (CSS variable references)
    COLORS: {
        CYAN: 'var(--cyan)',
        VIOLET: 'var(--violet)',
        LIME: 'var(--lime)',
        AMBER: 'var(--amber)',
        ROSE: 'var(--rose)',
        TEXT: 'var(--text)',
        MUTED: 'var(--muted)',
        PANEL: 'var(--panel)',
        STROKE: 'var(--stroke)',
    },
} as const;

// Provider normalization map
export const PROVIDER_MAP: Record<string, string> = {
    'aws': 'AWS',
    'amazon': 'AWS',
    'amazon web services': 'AWS',
    'gcp': 'GCP',
    'google': 'GCP',
    'google cloud': 'GCP',
    'github': 'GitHub',
    'pypi': 'PyPI',
    'python package index': 'PyPI',
    'cloudflare': 'Cloudflare',
    'vercel': 'Vercel',
    'netlify': 'Netlify',
};

export function normalizeProvider(name: string | undefined | null): string {
    if (!name) return 'Unknown Provider';
    const lower = name.toLowerCase().trim();
    return PROVIDER_MAP[lower] || name;
}

// Time ago helper
export function timeAgo(timestamp: string): string {
    const now = new Date();
    const then = new Date(timestamp);
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
}
