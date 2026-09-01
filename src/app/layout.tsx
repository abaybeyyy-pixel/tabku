import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  title: {
    default: 'Tapku — Platform Kartu Google Review NFC & Dynamic QR Indonesia',
    template: '%s | Tapku',
  },
  description: 'Tingkatkan ulasan bintang 5 bisnis Anda di Google Maps hingga 3x lipat dengan sekali tap kartu pintar NFC & Dynamic QR. Tanpa biaya langganan, fleksibel ubah link & lokasi kapan saja.',
  keywords: [
    'kartu google review',
    'nfc google review',
    'smart card ulasan google',
    'tapku',
    'dynamic link review',
    'google maps review card',
    'kartu review umkm',
    'tap review nfc',
  ],
  authors: [{ name: 'Tapku Indonesia' }],
  creator: 'Tapku Indonesia',
  publisher: 'Tapku',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: 'Tapku — Platform Kartu Google Review NFC & Dynamic QR',
    description: 'Banjir review bintang 5 di Google Maps hanya dengan sekali tempel HP. 1x Beli, aktif selamanya tanpa biaya langganan.',
    url: '/',
    siteName: 'Tapku',
    locale: 'id_ID',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Tapku — Platform Kartu Google Review NFC & Dynamic QR',
    description: 'Banjir review bintang 5 di Google Maps hanya dengan sekali tempel HP. 1x Beli, aktif selamanya.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <head>
        <meta name="theme-color" content="#16a34a" />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
