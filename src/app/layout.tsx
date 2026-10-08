import type { Metadata, Viewport } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'
import Navigation from '@/components/Navigation'
import DemoBanner from '@/components/DemoBanner'
import { themeInitScript, THEME_COLORS } from '@/lib/theme'

const geist = Geist({ subsets: ['latin'], variable: '--font-geist' })

export const metadata: Metadata = {
  title: 'Cash Registry',
  description: 'Gestione finanze personali',
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'Cash Registry' },
}

export const viewport: Viewport = {
  themeColor: THEME_COLORS.dark,
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it" className={`dark ${geist.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="font-sans antialiased bg-canvas text-fg min-h-screen transition-colors">
        <DemoBanner />
        <main className="mx-auto w-full max-w-screen-2xl pb-28 md:px-4">
          {children}
        </main>
        <Navigation />
      </body>
    </html>
  )
}
