import type { MetadataRoute } from 'next'

const base = process.env.NEXT_PUBLIC_BASE_PATH ?? ''

export const dynamic = 'force-static'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Cash Registry',
    short_name: 'Cash Registry',
    description: 'Gestione finanze personali',
    start_url: `${base}/`,
    display: 'standalone',
    background_color: '#080a12',
    theme_color: '#080a12',
    orientation: 'portrait',
    icons: [
      {
        src: `${base}/icon-192.png`,
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: `${base}/icon-192.png`,
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: `${base}/icon-512.png`,
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: `${base}/icon-512.png`,
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  }
}
