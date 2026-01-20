import { NormalizedEvent } from '@/src/types/realtime';

type ClassifyInput = {
    table: string;
    payload: any;
};

export function classifyEvent(input: ClassifyInput): NormalizedEvent | null {
    const { table, payload } = input;
    const row = payload.new || payload.old;

    if (!row) return null;

    const timestamp = new Date().toISOString();
    const id = `${table}-${row.id}-${timestamp}`;

    // Incidents table
    if (table === 'incidents') {
        const isResolved = row.status === 'Resolved' || row.active === false;
        const isNew = payload.eventType === 'INSERT';

        if (isResolved) {
            return {
                id,
                type: 'INCIDENT_RESOLVED',
                priority: 3,
                caption: `Service restored: ${row.title}`,
                subtitle: `${row.providers?.name || 'Service'} is now operational`,
                timestamp,
                metadata: row,
            };
        }

        if (isNew) {
            return {
                id,
                type: 'INCIDENT_NEW',
                priority: 2,
                caption: `New outage: ${row.title}`,
                subtitle: row.providers?.name || 'Unknown provider',
                timestamp,
                metadata: row,
            };
        }

        return {
            id,
            type: 'INCIDENT_UPDATE',
            priority: 4,
            caption: `Update: ${row.title}`,
            subtitle: row.status,
            timestamp,
            metadata: row,
        };
    }

    // Incident events (captions from bot)
    if (table === 'incident_events') {
        return {
            id,
            type: 'INCIDENT_UPDATE',
            priority: 3,
            caption: row.description || 'Service update received',
            timestamp,
            metadata: row,
        };
    }

    // Producer events (manual announcements)
    if (table === 'producer_events') {
        if (row.type === 'ANNOUNCE' && row.payload?.message) {
            return {
                id,
                type: 'MANUAL_ANNOUNCE',
                priority: 1, // Highest priority
                caption: row.payload.message,
                subtitle: 'Manual announcement',
                timestamp,
                metadata: row,
            };
        }
        return null;
    }

    // Internet conditions
    if (table === 'internet_conditions') {
        const isUnstable = row.status === 'unstable';

        if (isUnstable) {
            return {
                id,
                type: 'CONTEXT_CHANGE',
                priority: 5,
                caption: 'Internet instability detected',
                subtitle: row.description || 'Monitoring conditions',
                timestamp,
                metadata: row,
            };
        }
        return null;
    }

    return null;
}
