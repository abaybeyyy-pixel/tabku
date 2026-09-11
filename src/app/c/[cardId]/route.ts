import { NextRequest, NextResponse } from 'next/server';
import { findCardById, incrementCardTap } from '@/lib/db-helpers';

export const dynamic = 'force-dynamic';

function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (m) => {
    switch (m) {
      case '&': return '&amp;';
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '"': return '&quot;';
      case "'": return '&#39;';
      default: return m;
    }
  });
}

function getErrorPageHtml(title: string, message: string, buttonText: string, buttonHref: string) {
  const safeTitle = escapeHtml(title);
  const safeMessage = escapeHtml(message);
  const safeButtonText = escapeHtml(buttonText);
  const safeButtonHref = escapeHtml(buttonHref);

  return `<!DOCTYPE html>
<html lang="id">
  <head>
    <meta charset="utf-8">
    <title>${safeTitle}</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
      :root {
        --bg: #ffffff;
        --fg: #0f172a;
        --muted: #64748b;
        --border: #e2e8f0;
        --btn-bg: #1e3a8a;
        --btn-fg: #ffffff;
      }
      @media (prefers-color-scheme: dark) {
        :root {
          --bg: #09090b;
          --fg: #f8fafc;
          --muted: #94a3b8;
          --border: #27272a;
          --btn-bg: #3b82f6;
          --btn-fg: #ffffff;
        }
      }
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body { 
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; 
        background: var(--bg); 
        color: var(--fg); 
        display: flex; 
        align-items: center; 
        justify-content: center; 
        min-height: 100vh; 
        padding: 1.5rem;
        text-align: center; 
      }
      .container { 
        padding: 2.25rem 1.75rem; 
        border-radius: 16px; 
        background: var(--bg); 
        border: 1px solid var(--border); 
        max-width: 400px; 
        width: 100%; 
        box-shadow: 0 4px 20px -4px rgba(0, 0, 0, 0.08); 
      }
      h1 { 
        font-size: 1.15rem; 
        font-weight: 700; 
        margin-bottom: 0.5rem; 
        letter-spacing: -0.01em;
      }
      p { 
        color: var(--muted); 
        font-size: 0.85rem; 
        line-height: 1.5; 
        margin-bottom: 1.5rem; 
      }
      a { 
        display: inline-flex; 
        align-items: center;
        justify-content: center;
        width: 100%;
        min-height: 44px;
        padding: 0.75rem 1.25rem; 
        background: var(--btn-bg); 
        color: var(--btn-fg); 
        text-decoration: none; 
        border-radius: 10px; 
        font-size: 0.875rem;
        font-weight: 600; 
        transition: opacity 0.15s ease; 
      }
      a:hover { 
        opacity: 0.9;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <h1>${safeTitle}</h1>
      <p>${safeMessage}</p>
      <a href="${safeButtonHref}">${safeButtonText}</a>
    </div>
  </body>
</html>`;
}

/**
 * Generates an instantaneous, zero-latency HTML/JS client navigation bridge (HTTP 200 OK).
 * 
 * WHY THIS IS CRITICAL FOR NFC & QR CARDS:
 * Returning a bare HTTP 307 header causes mobile Safari, Samsung Internet, and In-App WebViews
 * (WhatsApp, Instagram, etc.) to chain the redirect with Google's internal auth/consent redirects.
 * When the browser's redirect threshold (3-5 hops) is reached, it fails with "Too many redirects occurred".
 * 
 * Serving an HTTP 200 OK with window.location.replace() COMPLETELY RESETS the browser's redirect counter
 * to zero, guaranteeing that the Google Review page or Google Maps app opens smoothly on every device.
 */
function getFastRedirectBridgeHtml(targetUrl: string, businessName?: string) {
  const safeTargetUrl = escapeHtml(targetUrl);
  const safeBusinessName = escapeHtml(businessName || '');

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="refresh" content="0;url=${safeTargetUrl}">
  <title>${safeBusinessName ? safeBusinessName + ' — Ulasan Google' : 'Membuka Ulasan Google...'}</title>
  <style>
    :root {
      --bg: #fafaf9;
      --card-bg: #ffffff;
      --text: #09090b;
      --muted: #64748b;
      --border: #e2e8f0;
      --primary: #1e3a8a;
    }
    @media (prefers-color-scheme: dark) {
      :root {
        --bg: #09090b;
        --card-bg: #18181b;
        --text: #fafafa;
        --muted: #a1a1aa;
        --border: #27272a;
        --primary: #3b82f6;
      }
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      background: var(--bg);
      color: var(--text);
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 1.5rem;
      text-align: center;
    }
    .card {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 2rem 1.5rem;
      max-width: 380px;
      width: 100%;
      box-shadow: 0 4px 20px -4px rgba(0, 0, 0, 0.08);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.85rem;
    }
    .spinner {
      width: 34px;
      height: 34px;
      border: 3px solid var(--border);
      border-top-color: var(--primary);
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    h1 {
      font-size: 1.1rem;
      font-weight: 700;
      color: var(--text);
      line-height: 1.3;
    }
    p {
      font-size: 0.825rem;
      color: var(--muted);
      line-height: 1.4;
    }
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      min-height: 46px;
      padding: 0.75rem 1.25rem;
      background: var(--primary);
      color: #ffffff;
      text-decoration: none;
      border-radius: 12px;
      font-size: 0.875rem;
      font-weight: 600;
      margin-top: 0.5rem;
      transition: opacity 0.15s ease;
    }
    .btn:active {
      opacity: 0.85;
    }
  </style>
  <script>
    (function() {
      var dest = ${JSON.stringify(targetUrl)};
      // Immediate client navigation to break any HTTP 3xx redirect chain
      try {
        window.location.replace(dest);
      } catch (e) {
        window.location.href = dest;
      }
    })();
  </script>
</head>
<body>
  <div class="card">
    <div class="spinner"></div>
    <h1>${safeBusinessName || 'Mengarahkan...'}</h1>
    <p>Sedang membuka halaman ulasan Google. Harap tunggu sebentar...</p>
    <a href="${safeTargetUrl}" class="btn">Buka Ulasan Google</a>
  </div>
</body>
</html>`;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ cardId: string }> }
) {
  const { cardId } = await params;
  const cleanCardId = (cardId || '').trim().toUpperCase();
  const card = await findCardById(cleanCardId);
  const cacheHeaders = {
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
  };

  // 1. If Card ID not found in database
  if (!card) {
    return new NextResponse(
      getErrorPageHtml(
        'Kartu Tidak Ditemukan',
        `ID Kartu ${cleanCardId} tidak ditemukan di database kami. Silakan periksa kembali kartu atau kode QR Anda.`,
        'Ke Beranda',
        '/'
      ),
      {
        status: 404,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          ...cacheHeaders,
        },
      }
    );
  }

  // 2. If status is UNACTIVATED -> Redirect to onboarding
  if (card.status === 'UNACTIVATED') {
    const redirectUrl = new URL(`/onboarding/${cleanCardId}`, request.url);
    const redirectResponse = NextResponse.redirect(redirectUrl, 307);
    Object.entries(cacheHeaders).forEach(([key, val]) => {
      redirectResponse.headers.set(key, val);
    });
    return redirectResponse;
  }

  // 3. If status is DISABLED
  if (card.status === 'DISABLED') {
    return new NextResponse(
      getErrorPageHtml(
        'Kartu Tidak Aktif',
        'Kartu ini sedang dalam status dinonaktifkan oleh pemilik.',
        'Ke Beranda',
        '/'
      ),
      {
        status: 403,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          ...cacheHeaders,
        },
      }
    );
  }

  // 4. If status is ACTIVE but destination is empty
  if (!card.destination_url || card.destination_url.trim().length === 0) {
    return new NextResponse(
      getErrorPageHtml(
        'Tujuan Belum Dikonfigurasi',
        'Kartu ini aktif namun belum memiliki tautan tujuan ulasan. Silakan perbarui melalui portal kelola.',
        'Kelola Kartu',
        '/manage'
      ),
      {
        status: 400,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          ...cacheHeaders,
        },
      }
    );
  }

  // 5. Check and format destination URL
  let targetUrl = (card.destination_url || '').trim();
  if (!/^https?:\/\//i.test(targetUrl)) {
    targetUrl = `https://${targetUrl}`;
  }

  // 6. Prevent Circular Self-Redirect Loops!
  const targetLower = targetUrl.toLowerCase();
  const cardIdLower = cleanCardId.toLowerCase();
  if (
    targetLower.includes(`/c/${cardIdLower}`) ||
    targetLower.includes(`/onboarding/${cardIdLower}`)
  ) {
    return new NextResponse(
      getErrorPageHtml(
        'Tautan Tidak Valid',
        'Tautan tujuan kartu ini mengarah kembali ke kartu ini sendiri (loop terdeteksi). Silakan perbarui URL tujuan melalui menu Kelola Kartu.',
        'Kelola Kartu',
        '/manage'
      ),
      {
        status: 400,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          ...cacheHeaders,
        },
      }
    );
  }

  // 7. Validate URL parsing
  try {
    new URL(targetUrl);
  } catch {
    return new NextResponse(
      getErrorPageHtml(
        'Format URL Tidak Valid',
        'Tautan tujuan yang tersimpan pada kartu ini tidak memiliki format yang valid. Silakan perbarui melalui menu Kelola Kartu.',
        'Kelola Kartu',
        '/manage'
      ),
      {
        status: 400,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          ...cacheHeaders,
        },
      }
    );
  }

  // 8. Track tap / scan asynchronously (non-blocking)
  const isQr = request.nextUrl.searchParams.get('src') === 'qr';
  incrementCardTap(card.card_id, isQr).catch((err) => {
    console.error('[Tap Tracking Error]:', err);
  });

  // 9. If client specifically requests JSON (API caller), return JSON
  const acceptHeader = request.headers.get('accept') || '';
  if (acceptHeader.includes('application/json') && !acceptHeader.includes('text/html')) {
    return NextResponse.json({
      success: true,
      destinationUrl: targetUrl,
      cardId: cleanCardId,
      businessName: card.business_name,
    });
  }

  // 10. Deliver Fast Client Navigation Bridge (HTTP 200 OK)
  // This resets the browser's redirect loop counter and navigates instantly.
  const htmlBridge = getFastRedirectBridgeHtml(targetUrl, card.business_name || undefined);
  return new NextResponse(htmlBridge, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      ...cacheHeaders,
    },
  });
}
