export type PresenterState = "IDLE" | "ALERT" | "TALKING" | "RESOLVED";

export type EventType =
    | "INCIDENT_NEW"
    | "INCIDENT_UPDATE"
    | "INCIDENT_RESOLVED"
    | "CONTEXT_CHANGE"
    | "MANUAL_ANNOUNCE";

export type NormalizedEvent = {
    id: string;
    type: EventType;
    priority: number; // 1=highest (manual), 5=lowest
    caption: string;
    subtitle?: string;
    timestamp: string;
    metadata?: any;
};

export type DirectorState = {
    presenterState: PresenterState;
    subtitleText: string | null;
    captionText: string | null;
    isSpeaking: boolean;
    lastSpokenAt: string | null;
};
