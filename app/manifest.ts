import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'Luxury Phone Manager',
    short_name: 'Luxury Manager',
    description: 'Gestion des réparations, clients, caisse et stock Luxury Phone',
    start_url: '/login',
    scope: '/',
    display: 'standalone',
    background_color: '#090711',
    theme_color: '#120b20',
    lang: 'fr',
    icons: [
      { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }
    ],
  }
}
