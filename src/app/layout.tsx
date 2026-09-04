import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://mycarrd.com'),
  title: {
    default: 'Jual Kartu Google Review NFC & Stand Akrilik Indonesia — Mycarrd',
    template: '%s | Jual Kartu Google Review NFC — Mycarrd',
  },
  description: 'Jual kartu Google Review NFC & Google Review Card Indonesia untuk resto, kafe, salon & klinik. Sekali tap HP langsung buka ulasan bintang 5 Google Maps. Akrilik 3mm anti air, QR dinamis, tanpa biaya langganan di mycarrd.com.',
  keywords: [
    'google review card',
    'kartu nfc',
    'kartu google review card',
    'jual google review card indonesia',
    'kartu google review',
    'kartu google review nfc',
    'google review card indonesia',
    'jual kartu google review',
    'beli google review card',
    'kartu nfc google maps',
    'smart card google review',
    'stand akrilik google review',
    'kartu ulasan google maps',
    'kartu ulasan bintang 5',
    'alat ulasan google maps',
    'tap review nfc',
    'mycarrd',
    'mycarrd.com',
  ],
  authors: [{ name: 'Mycarrd Indonesia', url: 'https://mycarrd.com' }],
  creator: 'Mycarrd Indonesia',
  publisher: 'Mycarrd',
  category: 'Business Technology',
  classification: 'Smart Cards / Google Review NFC & QR Code Tools',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: 'Jual Kartu Google Review NFC & Google Review Card Indonesia — Mycarrd',
    description: 'Jual kartu Google Review NFC & Google Review Card Indonesia. Sekali tap HP langsung ulasan bintang 5 Google Maps. 1x Beli, aktif selamanya tanpa biaya langganan di mycarrd.com.',
    url: 'https://mycarrd.com',
    siteName: 'Mycarrd',
    locale: 'id_ID',
    type: 'website',
    images: [
      {
        url: 'https://mycarrd.com/opengraph-image',
        width: 1200,
        height: 630,
        alt: 'Jual Kartu Google Review NFC & Google Review Card Indonesia Mycarrd',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Jual Kartu Google Review NFC & Google Review Card Indonesia — Mycarrd',
    description: 'Banjir ulasan bintang 5 di Google Maps hanya dengan sekali tempel HP. 1x Beli, aktif selamanya.',
    images: ['https://mycarrd.com/opengraph-image'],
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
      alternateName: ['Mycarrd', 'Jual Kartu Google Review NFC Indonesia', 'Google Review Card Indonesia'],
      url: 'https://mycarrd.com',
      logo: 'https://mycarrd.com/opengraph-image',
      description: 'Penyedia & Produsen Kartu Google Review NFC, Stand Akrilik & Dynamic QR No. 1 di Indonesia.',
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
      name: 'Mycarrd — Jual Kartu Google Review NFC Indonesia',
      publisher: {
        '@id': 'https://mycarrd.com/#organization',
      },
      inLanguage: 'id-ID',
    },
    {
      '@type': 'Product',
      '@id': 'https://mycarrd.com/#product',
      name: 'Kartu Google Review NFC & Google Review Card Indonesia — Mycarrd',
      alternateName: [
        'Google Review Card Indonesia',
        'Kartu Google Review Card',
        'Kartu NFC Google Review',
        'Smart Card Ulasan Google Maps Akrilik',
      ],
      image: 'https://mycarrd.com/opengraph-image',
      description: 'Jual kartu Google Review NFC dan Google Review Card akrilik tebal 3mm UV print berteknologi chip NFC & Dynamic QR untuk ulasan bintang 5 instan Google Maps dalam 2 detik.',
      brand: {
        '@type': 'Brand',
        name: 'Mycarrd',
      },
      offers: {
        '@type': 'Offer',
        url: 'https://mycarrd.com',
        priceCurrency: 'IDR',
        price: '99000',
        validFrom: '2024-01-01',
        priceValidUntil: '2028-12-31',
        itemCondition: 'https://schema.org/NewCondition',
        availability: 'https://schema.org/InStock',
        seller: {
          '@id': 'https://mycarrd.com/#organization',
        },
        shippingDetails: {
          '@type': 'OfferShippingDetails',
          shippingRate: {
            '@type': 'MonetaryAmount',
            value: '0',
            currency: 'IDR',
          },
          shippingDestination: {
            '@type': 'DefinedRegion',
            addressCountry: 'ID',
          },
          deliveryTime: {
            '@type': 'ShippingDeliveryTime',
            handlingTime: {
              '@type': 'QuantitativeValue',
              minValue: 1,
              maxValue: 2,
              unitCode: 'DAY',
            },
            transitTime: {
              '@type': 'QuantitativeValue',
              minValue: 1,
              maxValue: 3,
              unitCode: 'DAY',
            },
          },
        },
        hasMerchantReturnPolicy: {
          '@type': 'MerchantReturnPolicy',
          applicableCountry: 'ID',
          returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
          merchantReturnDays: 7,
          returnMethod: 'https://schema.org/ReturnByMail',
          returnFees: 'https://schema.org/FreeReturn',
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
          name: 'Apa itu Google Review Card dan Kartu NFC Review?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Google Review Card adalah kartu pintar berbasis teknologi NFC (Near Field Communication) dan QR code dinamis yang dirancang agar pelanggan toko atau bisnis fisik dapat langsung membuka form ulasan Google Maps bintang 5 hanya dengan sekali menempelkan HP mereka tanpa perlu mencari nama toko manual.',
          },
        },
        {
          '@type': 'Question',
          name: 'Bagaimana cara kerja Kartu Google Review Mycarrd?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Kartu dilengkapi chip NFC NTAG resmi dan kode QR dinamis. Saat pelanggan menempelkan smartphone atau scan kode QR di kartu, layar HP otomatis membuka form resmi ulasan Google Maps bisnis Anda untuk memberi rating bintang 5 dalam 2 detik.',
          },
        },
        {
          '@type': 'Question',
          name: 'Apakah kartu NFC ulasan kompatibel dengan semua jenis HP?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Ya, kartu ini kompatibel dengan semua smartphone modern. Untuk iPhone (iPhone 7 ke atas) dan semua smartphone Android yang memiliki fitur NFC, pelanggan cukup menempelkan HP. Untuk HP yang belum ada NFC, pelanggan bisa memindai kode QR dinamis berkualitas tinggi yang tertera di kartu.',
          },
        },
        {
          '@type': 'Question',
          name: 'Apakah nama tempat atau link Google Maps bisa diubah kapan saja?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Bisa 100% fleksibel. Dengan memasukkan ID Kartu dan PIN di portal mycarrd.com/manage, Anda bebas memperbarui nama bisnis dan Place ID Google Maps kapan saja secara realtime di cloud tanpa perlu mengganti atau mencetak ulang kartu fisik.',
          },
        },
        {
          '@type': 'Question',
          name: 'Apakah ada biaya langganan bulanan?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Tidak ada biaya langganan. Mycarrd menggunakan skema 1x beli aktif selamanya (beli putus) dengan akses penuh ke portal manajemen kartu tanpa batasan kuota ulasan.',
          },
        },
        {
          '@type': 'Question',
          name: 'Apakah kartu tahan air dan bergaransi?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Ya, 100% tahan air dan anti luntur dengan material akrilik tebal 3mm UV print serta dilengkapi garansi resmi Lifetime Warranty ganti unit baru jika ada kerusakan chip NFC.',
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
        <meta name="geo.region" content="ID" />
        <meta name="geo.placename" content="Indonesia" />
        <meta name="google" content="notranslate" />
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
