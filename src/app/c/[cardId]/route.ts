import { NextRequest, NextResponse } from 'next/server';
import { findCardById } from '@/lib/db-helpers';

export const dynamic = 'force-dynamic';

function getErrorPageHtml(title: string, message: string, buttonText: string, buttonHref: string) {
  return `<html>
    <head>
      <title>${title}</title>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        :root {
          --bg: #ffffff;
          --fg: #000000;
          --muted: #666666;
          --border: #e5e5e5;
          --btn-bg: #000000;
          --btn-fg: #ffffff;
          --btn-hover: #1a1a1a;
        }
        @media (prefers-color-scheme: dark) {
          :root {
            --bg: #0a0a0a;
            --fg: #ffffff;
            --muted: #a3a3a3;
            --border: #262626;
            --btn-bg: #ffffff;
            --btn-fg: #000000;
            --btn-hover: #e5e5e5;
          }
        }
        body { 
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; 
          background: var(--bg); 
          color: var(--fg); 
          display: flex; 
          align-items: center; 
          justify-content: center; 
          height: 100vh; 
          margin: 0; 
          text-align: center; 
          transition: background-color 0.2s ease, color 0.2s ease;
        }
        .container { 
          padding: 40px 30px; 
          border-radius: 8px; 
          background: var(--bg); 
          border: 1px solid var(--border); 
          max-width: 400px; 
          width: 90%; 
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05); 
        }
        h1 { 
          font-size: 20px; 
          font-weight: 700; 
          margin: 0 0 12px 0; 
          text-transform: uppercase;
          letter-spacing: -0.01em;
        }
        p { 
          color: var(--muted); 
          font-size: 15px; 
          line-height: 1.5; 
          margin: 0 0 28px 0; 
        }
        a { 
          display: inline-block; 
          padding: 10px 20px; 
          background: var(--btn-bg); 
          color: var(--btn-fg); 
          text-decoration: none; 
          border-radius: 6px; 
          font-size: 14px;
          font-weight: 600; 
          transition: background-color 0.1s; 
        }
        a:hover { 
          background: var(--btn-hover); 
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>${title}</h1>
        <p>${message}</p>
        <a href="${buttonHref}">${buttonText}</a>
      </div>
    </body>
  </html>`;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ cardId: string }> }
) {
  const { cardId } = await params;
  const card = await findCardById(cardId.toUpperCase());
  const cacheHeaders = {
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
  };

  // If Card ID not found
  if (!card) {
    return new NextResponse(
      getErrorPageHtml(
        'Kartu Tidak Ditemukan',
        `ID Kartu ${cardId} tidak ditemukan di database kami. Silakan periksa kode QR atau parameter tap.`,
        'Ke Beranda',
        '/'
      ),
      {
        status: 404,
        headers: {
          'Content-Type': 'text/html',
          ...cacheHeaders,
        },
      }
    );
  }

  // If status is UNACTIVATED
  if (card.status === 'UNACTIVATED') {
    const redirectUrl = new URL(`/onboarding/${card.card_id}`, request.url);
    const redirectResponse = NextResponse.redirect(redirectUrl, 307);
    Object.entries(cacheHeaders).forEach(([key, val]) => {
      redirectResponse.headers.set(key, val);
    });
    return redirectResponse;
  }

  // If status is DISABLED
  if (card.status === 'DISABLED') {
    return new NextResponse(
      getErrorPageHtml(
        'Kartu Tidak Aktif',
        'Kartu Anda sedang dalam status nonaktif.',
        'Ke Beranda',
        '/'
      ),
      {
        status: 403,
        headers: {
          'Content-Type': 'text/html',
          ...cacheHeaders,
        },
      }
    );
  }

  // If status is ACTIVE but destination is empty
  if (!card.destination_url) {
    return new NextResponse(
      getErrorPageHtml(
        'Tujuan Belum Dikonfigurasi',
        'Kartu ini aktif tetapi belum memiliki URL tujuan yang dikonfigurasi.',
        'Kelola Kartu',
        '/manage'
      ),
      {
        status: 400,
        headers: {
          'Content-Type': 'text/html',
          ...cacheHeaders,
        },
      }
    );
  }

  // Successful redirect to Google Review / Destination URL without caching
  const redirectResponse = NextResponse.redirect(card.destination_url, 307);
  Object.entries(cacheHeaders).forEach(([key, val]) => {
    redirectResponse.headers.set(key, val);
  });
  
  return redirectResponse;
}
