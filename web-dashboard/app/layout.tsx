import type { Metadata } from 'next'
import { Rajdhani, Spline_Sans_Mono } from 'next/font/google'
import './globals.css'
import { cn } from '@/lib/utils'

const display = Rajdhani({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-display' })
const mono = Spline_Sans_Mono({ subsets: ['latin'], variable: '--font-mono' })

export const metadata: Metadata = {
  title: 'Tech Outage Monitor',
  description: 'Live-streamable tech outage monitoring dashboard',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={cn(display.variable, mono.variable, "bg-black text-white overflow-hidden h-screen w-screen")}> 
        {children}
      </body>
    </html>
  )
}
