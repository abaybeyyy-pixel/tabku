import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://mycarrd.com'),
  title: {
    default: 'Mycarrd — Platform Kartu Google Review NFC & Dynamic QR Indonesia (mycarrd.com)',
    template: '%s | Mycarrd',
  },
  description: 'Tingkatkan ulasan bintang 5 bisnis Anda di Google Maps hingga 3x lipat dengan sekali tap kartu pintar NFC & Dynamic QR. Tanpa biaya langganan, fleksibel ubah link & lokasi kapan saja di mycarrd.com.',
  keywords: [
    'kartu google review',
    'nfc google review',
    'smart card ulasan google',
    'mycarrd',
    'mycarrd.com',
    'tapku',
    'dynamic link review',
    'google maps review card',
    'kartu review umkm',
    'tap review nfc',
  ],
  authors: [{ name: 'Mycarrd Indonesia' }],
  creator: 'Mycarrd Indonesia',
  publisher: 'Mycarrd',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: 'Mycarrd — Platform Kartu Google Review NFC & Dynamic QR (mycarrd.com)',
    description: 'Banjir review bintang 5 di Google Maps hanya dengan sekali tempel HP. 1x Beli, aktif selamanya tanpa biaya langganan di mycarrd.com.',
    url: 'https://mycarrd.com',
    siteName: 'Mycarrd',
    locale: 'id_ID',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Mycarrd — Platform Kartu Google Review NFC & Dynamic QR (mycarrd.com)',
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
