"use client"
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { motion } from 'framer-motion'

type Event = {
    id: string
    description: string
    created_at: string
}

export default function NewsTicker() {
    const [events, setEvents] = useState<Event[]>([])

    useEffect(() => {
        fetchEvents()

        // Subscribe to NEW events only
        const channel = supabase
            .channel('events-ticker')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'incident_events' }, (payload) => {
                setEvents(prev => [payload.new as Event, ...prev].slice(0, 10))
            })
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [])

    async function fetchEvents() {
        const { data } = await supabase
            .from('incident_events')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(10)

        if (data) setEvents(data)
    }

    return (
        <div className="fixed bottom-0 left-0 w-full h-12 bg-red-950/80 border-t border-red-900 flex items-center overflow-hidden z-50">
            <div className="bg-red-900 text-white font-bold px-4 h-full flex items-center z-10 shrink-0 uppercase tracking-widest text-sm">
                Breaking News
            </div>
            <div className="flex whitespace-nowrap overflow-hidden w-full">
                <motion.div
                    className="flex gap-12 pl-4 text-white/90 font-mono text-sm items-center"
                    animate={{ x: [0, -1000] }}
                    transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
                >
                    {events.map((e) => (
                        <span key={e.id} className="flex items-center gap-2">
                            <span className="text-red-400">●</span> {e.description}
                            <span className="text-gray-400 text-xs">[{new Date(e.created_at).toLocaleTimeString()}]</span>
                        </span>
                    ))}
                    {/* Duplicate for seamless looop if needed, but linear x translate works nicely for basic */}
                    {events.length === 0 && <span>Waiting for updates... Systems Nominal.</span>}
                </motion.div>
            </div>
        </div>
    )
}
