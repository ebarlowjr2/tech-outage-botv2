"use client"
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { motion, AnimatePresence } from 'framer-motion'
import { Activity, Mic, ShieldCheck } from 'lucide-react'

export default function SystemPresenter() {
    const [activeAlert, setActiveAlert] = useState<string | null>(null)

    useEffect(() => {
        const channel = supabase
            .channel('presenter-alerts')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'incident_events' }, (payload) => {
                triggerAlert(payload.new.description)
            })
            .subscribe()

        return () => { supabase.removeChannel(channel) }
    }, [])

    function triggerAlert(text: string) {
        setActiveAlert(text)
        // Audio trigger would go here
        setTimeout(() => setActiveAlert(null), 8000)
    }

    return (
        <div className="absolute top-6 right-6 z-50 pointer-events-none">
            <div className="glass p-3 flex items-center gap-4 bg-black/80 backdrop-blur-xl border-white/10 shadow-2xl">
                {/* Status Indicator */}
                <div className="flex flex-col items-end">
                    <div className="text-[10px] tracking-widest text-gray-400 font-medium">SYSTEM PRESENTER</div>
                    <div className="flex items-center gap-2 mt-1">
                        <span className={`text-xs font-mono transition-colors duration-500 ${activeAlert ? "text-cyan-400" : "text-gray-500"}`}>
                            {activeAlert ? "NARRATION ACTIVE" : "MONITORING"}
                        </span>
                        <div className={`w-2 h-2 rounded-full ${activeAlert ? "bg-cyan-400 animate-pulse" : "bg-teal-500/50"}`} />
                    </div>
                </div>

                {/* Icon */}
                <div className={`p-2 rounded-lg border transition-colors duration-500 ${activeAlert ? "bg-cyan-950/50 border-cyan-500/30" : "bg-white/5 border-white/5"}`}>
                    {activeAlert ? <Mic className="w-5 h-5 text-cyan-400" /> : <Activity className="w-5 h-5 text-gray-500" />}
                </div>
            </div>

            {/* Subtitles Overlay */}
            <AnimatePresence>
                {activeAlert && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className="mt-2 text-right max-w-sm ml-auto"
                    >
                        <div className="bg-black/90 text-white/90 text-sm p-3 rounded-lg border border-white/10 shadow-xl leading-relaxed">
                            {activeAlert}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
