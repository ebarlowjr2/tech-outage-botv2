// Incident type mapper for Supabase rows
export type SupabaseIncidentRow = {
    id: string;
    title: string;
    status: string;
    severity: 'minor' | 'major' | 'critical';
    url?: string;
    raw_text?: string;
    last_update: string;
    active: boolean;
    provider_id?: string;
    providers?: {
        name: string;
    };
};

export type Incident = {
    id: string;
    provider: string;
    title: string;
    severity: "good" | "warn" | "bad";
    status: string;
    region?: string;
    updatedAt: string;
};

export function mapIncidentRow(row: SupabaseIncidentRow): Incident {
    return {
        id: row.id,
        provider: row.providers?.name || "Unknown",
        title: row.title,
        severity: row.severity === 'critical' ? 'bad' : row.severity === 'major' ? 'warn' : 'good',
        status: row.status,
        region: "GLOBAL",
        updatedAt: row.last_update
    };
}
