import IncidentList from './components/IncidentList'
import NewsTicker from './components/NewsTicker'
import RobotWidget from './components/RobotWidget'

export default function Home() {
  return (
    <main className="flex h-screen w-screen bg-black relative">
      {/* Sidebar - Z-Index higher than map */}
      <div className="z-10 h-full">
        <IncidentList />
      </div>

      {/* Map Container (Background) */}
      <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
        {/* Placeholder for ThreatMap - using CSS grid pattern for "tech" look */}
        <div className="w-full h-full opacity-20"
          style={{ backgroundImage: 'radial-gradient(circle, #333 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
        </div>
        <div className="absolute text-gray-600 font-mono tracking-[0.5em] text-4xl opacity-50 select-none pointer-events-none">
          GLOBAL THREAT MONITOR
        </div>
      </div>

      {/* Widgets */}
      <RobotWidget />

      {/* Footer Ticker */}
      <NewsTicker />
    </main>
  )
}
