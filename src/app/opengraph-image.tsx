import { ImageResponse } from 'next/og';

export const runtime = 'nodejs';
export const alt = 'Mycarrd — Platform Kartu Google Review NFC & Dynamic QR (mycarrd.com)';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #0b132b 0%, #1c2541 50%, #064e3b 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          padding: '60px 80px',
          fontFamily: 'sans-serif',
          color: '#ffffff',
          position: 'relative',
        }}
      >
        {/* Top Header Badge */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div
              style={{
                width: '52px',
                height: '52px',
                borderRadius: '14px',
                background: '#2563eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '26px',
                fontWeight: '900',
                color: '#ffffff',
                boxShadow: '0 8px 24px rgba(37, 99, 235, 0.4)',
              }}
            >
              M
            </div>
            <span style={{ fontSize: '36px', fontWeight: '900', letterSpacing: '-0.03em', color: '#ffffff' }}>
              MYCARRD
            </span>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 24px',
              borderRadius: '999px',
              background: 'rgba(34, 197, 94, 0.15)',
              border: '1.5px solid rgba(34, 197, 94, 0.5)',
              color: '#4ade80',
              fontSize: '18px',
              fontWeight: '700',
            }}
          >
            ★ Smart Card No. 1 di Indonesia
          </div>
        </div>

        {/* Center Main Title & Stars */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '900px' }}>
          <div style={{ display: 'flex', gap: '8px', color: '#fbbf24', fontSize: '32px' }}>
            ★★★★★
          </div>
          <h1
            style={{
              fontSize: '54px',
              fontWeight: '900',
              lineHeight: 1.15,
              letterSpacing: '-0.02em',
              margin: 0,
              background: 'linear-gradient(to right, #ffffff, #e2e8f0, #86efac)',
              backgroundClip: 'text',
              color: 'transparent',
            }}
          >
            Banjir Review Bintang 5 di Google Maps Sekali Tap HP
          </h1>
          <p
            style={{
              fontSize: '24px',
              color: '#94a3b8',
              margin: 0,
              lineHeight: 1.4,
            }}
          >
            Solusi Pintar Kartu NFC &amp; Dynamic QR untuk Kafe, Restoran, Klinik, Barbershop &amp; Toko Retail.
          </p>
        </div>

        {/* Bottom Feature Tags */}
        <div style={{ display: 'flex', gap: '20px', width: '100%' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 22px',
              borderRadius: '12px',
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              fontSize: '17px',
              fontWeight: '600',
              color: '#cbd5e1',
            }}
          >
            ✓ 1x Beli Aktif Selamanya
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 22px',
              borderRadius: '12px',
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              fontSize: '17px',
              fontWeight: '600',
              color: '#cbd5e1',
            }}
          >
            ✓ Bebas Ubah Lokasi &amp; Link
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 22px',
              borderRadius: '12px',
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              fontSize: '17px',
              fontWeight: '600',
              color: '#cbd5e1',
            }}
          >
            ✓ Support iOS &amp; Android
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
