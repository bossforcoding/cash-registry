import type { Metadata, Viewport } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'
import Navigation from '@/components/Navigation'
import DemoBanner from '@/components/DemoBanner'

const geist = Geist({ subsets: ['latin'], variable: '--font-geist' })

export const metadata: Metadata = {
  title: 'Cash Registry',
  description: 'Gestione finanze personali',
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'Cash Registry' },
}

export const viewport: Viewport = {
  themeColor: '#0f172a',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it" className="dark">
      <body className={`${geist.variable} font-sans antialiased bg-slate-950 text-slate-50 min-h-screen`}>
        <DemoBanner />
        <div className="pb-24">
          {children}
        </div>
        <Navigation />
      </body>
    </html>
  )
}
