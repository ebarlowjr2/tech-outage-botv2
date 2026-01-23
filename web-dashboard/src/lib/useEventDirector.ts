import { useState, useCallback, useRef, useEffect } from 'react';
import { NormalizedEvent, DirectorState, PresenterState } from '@/src/types/realtime';

type DirectorOptions = {
    ttsEnabledDefault?: boolean;
    minGapMsBetweenSpeaks?: number;
    displayDurationMs?: number;
    fadeDurationMs?: number;
};

export function useEventDirector(options: DirectorOptions = {}) {
    const {
        displayDurationMs = 8000,
        fadeDurationMs = 200,
    } = options;

    // State
    const [state, setState] = useState<DirectorState>({
        presenterState: 'IDLE',
        subtitleText: null,
        captionText: null,
        isSpeaking: false,
        lastSpokenAt: null,
        activeIncidentId: null,
    });

    // Queue management
    const queueRef = useRef<NormalizedEvent[]>([]);
    const processedIdsRef = useRef<Set<string>>(new Set());
    const isProcessingRef = useRef(false);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Preemption support
    const activeEventRef = useRef<NormalizedEvent | null>(null);
    const cancelTokenRef = useRef(0);
    const interruptedEventRef = useRef<NormalizedEvent | null>(null);

    // Stop active event cleanly
    const stopActiveEvent = useCallback(() => {
        // Clear timeout
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }

        // Increment cancel token to invalidate any pending state updates
        cancelTokenRef.current++;

        // Fade out (set to IDLE, clear captions)
        setState({
            presenterState: 'IDLE',
            subtitleText: null,
            captionText: null,
            isSpeaking: false,
            lastSpokenAt: state.lastSpokenAt,
            activeIncidentId: null,
        });

        // Mark as no longer processing (will be restarted immediately)
        isProcessingRef.current = false;
    }, [state.lastSpokenAt]);

    // Check if event is still relevant
    const isEventRelevant = useCallback((event: NormalizedEvent): boolean => {
        // Always keep producer announces
        if (event.type === 'MANUAL_ANNOUNCE') return true;

        // Drop context changes and resolved events (stale)
        if (event.type === 'CONTEXT_CHANGE' || event.type === 'INCIDENT_RESOLVED') {
            return false;
        }

        // Keep new incidents and updates (assume still relevant)
        return true;
    }, []);

    // Enqueue event with preemption support
    const enqueue = useCallback((event: NormalizedEvent) => {
        // Deduplication
        if (processedIdsRef.current.has(event.id)) {
            return;
        }

        // PREEMPTION: If this is a producer announce and we're currently speaking
        if (event.type === 'MANUAL_ANNOUNCE' && isProcessingRef.current && activeEventRef.current) {
            // Save interrupted event for potential resume
            interruptedEventRef.current = activeEventRef.current;

            // Stop current event
            stopActiveEvent();

            // Clear queue of other producer announces (latest wins)
            queueRef.current = queueRef.current.filter(e => e.type !== 'MANUAL_ANNOUNCE');

            // Add this event to front of queue
            queueRef.current.unshift(event);

            // Wait for fade, then start processing
            setTimeout(() => {
                processQueue();
            }, fadeDurationMs);

            return;
        }

        // Normal enqueue: Add to queue (sorted by priority)
        queueRef.current.push(event);
        queueRef.current.sort((a, b) => a.priority - b.priority);

        // Start processing if not already
        if (!isProcessingRef.current) {
            processQueue();
        }
    }, [fadeDurationMs, stopActiveEvent]);

    // Process queue with cancellation safety
    const processQueue = useCallback(() => {
        if (queueRef.current.length === 0) {
            // Check if we should resume interrupted event
            if (interruptedEventRef.current && isEventRelevant(interruptedEventRef.current)) {
                const resumeEvent = interruptedEventRef.current;
                interruptedEventRef.current = null;

                // Re-enqueue (will be processed next)
                queueRef.current.push(resumeEvent);
                queueRef.current.sort((a, b) => a.priority - b.priority);
            }

            // If still empty, go idle
            if (queueRef.current.length === 0) {
                isProcessingRef.current = false;
                activeEventRef.current = null;
                setState(prev => ({
                    ...prev,
                    presenterState: 'IDLE',
                    isSpeaking: false,
                    activeIncidentId: null,
                }));
                return;
            }
        }

        isProcessingRef.current = true;
        const event = queueRef.current.shift()!;
        activeEventRef.current = event;

        // Clear interrupted event if we're starting a new one
        if (event.type === 'MANUAL_ANNOUNCE') {
            interruptedEventRef.current = null;
        }

        // Mark as processed
        processedIdsRef.current.add(event.id);

        // Get cancellation token for this event
        const token = ++cancelTokenRef.current;

        // Determine presenter state
        let presenterState: PresenterState = 'TALKING';
        if (event.type === 'INCIDENT_RESOLVED') {
            presenterState = 'RESOLVED';
        } else if (event.type === 'INCIDENT_NEW') {
            presenterState = 'ALERT';
        }

        // Extract incident ID from metadata if available
        const incidentId = event.metadata?.id || null;

        // Update state
        setState({
            presenterState,
            subtitleText: event.subtitle || null,
            captionText: event.caption,
            isSpeaking: true,
            lastSpokenAt: event.timestamp,
            activeIncidentId: incidentId,
        });

        // Clear after display duration
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(() => {
            // Check cancellation token
            if (token !== cancelTokenRef.current) return;

            setState(prev => ({
                ...prev,
                presenterState: 'IDLE',
                captionText: null,
                subtitleText: null,
                isSpeaking: false,
                activeIncidentId: null,
            }));

            // Process next event after a brief gap
            setTimeout(() => {
                // Check cancellation token again
                if (token !== cancelTokenRef.current) return;
                processQueue();
            }, 500);
        }, displayDurationMs);
    }, [displayDurationMs, isEventRelevant]);

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
