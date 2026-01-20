import { useState, useCallback, useRef, useEffect } from 'react';
import { NormalizedEvent, DirectorState, PresenterState } from '@/src/types/realtime';

type DirectorOptions = {
    ttsEnabledDefault?: boolean;
    minGapMsBetweenSpeaks?: number;
    displayDurationMs?: number;
};

export function useEventDirector(options: DirectorOptions = {}) {
    const {
        displayDurationMs = 8000,
    } = options;

    // State
    const [state, setState] = useState<DirectorState>({
        presenterState: 'IDLE',
        subtitleText: null,
        captionText: null,
        isSpeaking: false,
        lastSpokenAt: null,
    });

    // Queue management
    const queueRef = useRef<NormalizedEvent[]>([]);
    const processedIdsRef = useRef<Set<string>>(new Set());
    const isProcessingRef = useRef(false);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Enqueue event
    const enqueue = useCallback((event: NormalizedEvent) => {
        // Deduplication
        if (processedIdsRef.current.has(event.id)) {
            return;
        }

        // Add to queue (sorted by priority)
        queueRef.current.push(event);
        queueRef.current.sort((a, b) => a.priority - b.priority);

        // Start processing if not already
        if (!isProcessingRef.current) {
            processQueue();
        }
    }, []);

    // Process queue
    const processQueue = useCallback(() => {
        if (queueRef.current.length === 0) {
            isProcessingRef.current = false;
            setState(prev => ({
                ...prev,
                presenterState: 'IDLE',
                isSpeaking: false,
            }));
            return;
        }

        isProcessingRef.current = true;
        const event = queueRef.current.shift()!;

        // Mark as processed
        processedIdsRef.current.add(event.id);

        // Determine presenter state
        let presenterState: PresenterState = 'TALKING';
        if (event.type === 'INCIDENT_RESOLVED') {
            presenterState = 'RESOLVED';
        } else if (event.type === 'INCIDENT_NEW') {
            presenterState = 'ALERT';
        }

        // Update state
        setState({
            presenterState,
            subtitleText: event.subtitle || null,
            captionText: event.caption,
            isSpeaking: true,
            lastSpokenAt: event.timestamp,
        });

        // Clear after display duration
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(() => {
            setState(prev => ({
                ...prev,
                presenterState: 'IDLE',
                captionText: null,
                subtitleText: null,
                isSpeaking: false,
            }));

            // Process next event
            setTimeout(() => {
                processQueue();
            }, 500);
        }, displayDurationMs);
    }, [displayDurationMs]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    return {
        ...state,
        enqueue,
    };
}
