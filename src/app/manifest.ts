import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Mycarrd — Smart Card Google Review NFC & Dynamic QR',
    short_name: 'Mycarrd',
    description: 'Tingkatkan ulasan bintang 5 bisnis Anda di Google Maps hingga 3x lipat dengan sekali tap kartu pintar NFC & Dynamic QR.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0b132b',
    theme_color: '#16a34a',
    icons: [
      {
        src: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
    ],
  };
}
