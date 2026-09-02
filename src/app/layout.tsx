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
  verification: {
    google: 'n3tyZGI6_gQFAMZwqaPHKKjdpgpuEHKxXm-74uiWXlA',
  },
  alternates: {
    canonical: 'https://mycarrd.com',
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/favicon.ico',
  },
};

const jsonLdData = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': 'https://mycarrd.com/#organization',
      name: 'Mycarrd Indonesia',
      url: 'https://mycarrd.com',
      logo: 'https://mycarrd.com/opengraph-image',
      description: 'Platform Kartu Google Review NFC & Dynamic QR No. 1 di Indonesia.',
      contactPoint: {
        '@type': 'ContactPoint',
        telephone: '+62-812-1115-6865',
        contactType: 'customer support',
        areaServed: 'ID',
        availableLanguage: ['Indonesian'],
      },
    },
    {
      '@type': 'WebSite',
      '@id': 'https://mycarrd.com/#website',
      url: 'https://mycarrd.com',
      name: 'Mycarrd',
      publisher: {
        '@id': 'https://mycarrd.com/#organization',
      },
      inLanguage: 'id-ID',
    },
    {
      '@type': 'Product',
      '@id': 'https://mycarrd.com/#product',
      name: 'Mycarrd Smart Card Google Review NFC & Dynamic QR',
      image: 'https://mycarrd.com/opengraph-image',
      description: 'Kartu akrilik premium 3mm berteknologi NFC & Dynamic QR untuk mengumpulkan ulasan Google Maps bintang 5 secara instan dalam 2 detik.',
      brand: {
        '@type': 'Brand',
        name: 'Mycarrd',
      },
      offers: {
        '@type': 'Offer',
        url: 'https://mycarrd.com',
        priceCurrency: 'IDR',
        price: '99000',
        priceValidUntil: '2028-12-31',
        availability: 'https://schema.org/InStock',
        seller: {
          '@id': 'https://mycarrd.com/#organization',
        },
      },
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: '4.9',
        bestRating: '5.0',
        worstRating: '1.0',
        ratingCount: '850',
        reviewCount: '850',
      },
    },
    {
      '@type': 'FAQPage',
      '@id': 'https://mycarrd.com/#faq',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'Bagaimana cara kerja Kartu Google Review Mycarrd?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Kartu dilengkapi chip NFC dan kode QR dinamis. Saat pelanggan menempelkan smartphone atau scan kode QR di kartu, layar HP langsung membuka form resmi ulasan Google Maps untuk memberi rating bintang 5 dalam 2 detik.',
          },
        },
        {
          '@type': 'Question',
          name: 'Apakah nama tempat atau link Google Maps bisa diubah kapan saja?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Bisa 100% fleksibel. Dengan memasukkan ID Kartu dan PIN di portal mycarrd.com/manage, Anda bebas memperbarui nama bisnis dan Place ID Google Maps kapan saja tanpa perlu mengganti kartu fisik.',
          },
        },
        {
          '@type': 'Question',
          name: 'Apakah ada biaya langganan bulanan?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Tidak ada biaya langganan. Mycarrd menggunakan skema 1x investasi beli putus dengan akses penuh selamanya tanpa batasan kuota ulasan.',
          },
        },
        {
          '@type': 'Question',
          name: 'Apakah kartu tahan air dan bergaransi?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Ya, 100% tahan air dan anti luntur dengan material akrilik tebal 3mm UV print serta dilengkapi garansi resmi Lifetime Warranty.',
          },
        },
      ],
    },
  ],
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
        <meta name="google-site-verification" content="n3tyZGI6_gQFAMZwqaPHKKjdpgpuEHKxXm-74uiWXlA" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdData) }}
        />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
