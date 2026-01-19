"use client"
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { motion, AnimatePresence } from 'framer-motion'
import { Bot } from 'lucide-react'

export default function RobotWidget() {
    const [activeAlert, setActiveAlert] = useState<string | null>(null)

    useEffect(() => {
        const channel = supabase
            .channel('robot-alerts')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'incident_events' }, (payload) => {
                // New Alert!
                triggerAlert(payload.new.description)
            })
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [])

    function triggerAlert(text: string) {
        setActiveAlert(text)
        // Here we would trigger Audio playback if we had the file
        // const audio = new Audio('/alert.mp3')
        // audio.play()

        // Clear alert after 8 seconds
        setTimeout(() => setActiveAlert(null), 8000)
    }

    return (
        <div className="absolute top-4 right-4 z-40 flexflex-col items-end pointer-events-none">
            {/* Robot Avatar */}
            <motion.div
                className="w-24 h-24 bg-blue-500/20 backdrop-blur-md rounded-full border-2 border-blue-400 flex items-center justify-center relative shadow-[0_0_30px_rgba(59,130,246,0.5)]"
                animate={{
                    scale: activeAlert ? [1, 1.1, 1] : 1,
                    borderColor: activeAlert ? '#ef4444' : '#60a5fa'
                }}
                transition={{ repeat: activeAlert ? Infinity : 0, duration: 0.5 }}
            >
                <Bot className={`w-12 h-12 ${activeAlert ? 'text-red-400' : 'text-blue-200'}`} />

                {/* Audio Waves Animation */}
                {activeAlert && (
                    <div className="absolute inset-0 rounded-full border border-red-500 animate-ping opacity-75"></div>
                )}
            </motion.div>

            {/* Speech Bubble */}
            <AnimatePresence>
                {activeAlert && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.9 }}
                        className="mt-4 bg-black/80 border border-blue-500/50 p-4 rounded-xl max-w-sm backdrop-blur-md text-blue-100 font-mono text-sm shadow-2xl"
                    >
                        <span className="text-red-400 font-bold">ALERT:</span> {activeAlert}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
