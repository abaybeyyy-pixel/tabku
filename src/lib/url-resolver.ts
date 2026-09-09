export function extractPlaceIdFromFtid(ftid: string): string | null {
  try {
    const parts = ftid.split(':');
    if (parts.length !== 2) return null;
    
    const hex1 = parts[0].replace('0x', '');
    const hex2 = parts[1].replace('0x', '');
    
    const h1 = hex1.padStart(16, '0');
    const h2 = hex2.padStart(16, '0');
    
    const buf1 = Buffer.from(h1, 'hex').reverse();
    const buf2 = Buffer.from(h2, 'hex').reverse();
    
    const result = Buffer.alloc(20);
    result[0] = 0x0a;
    result[1] = 0x12;
    result[2] = 0x09;
    buf1.copy(result, 3);
    result[11] = 0x11;
    buf2.copy(result, 12);
    
    let b64 = result.toString('base64');
    b64 = b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    return b64;
  } catch {
    return null;
  }
}

export interface ResolvedPlaceDetails {
  name: string;
  placeId: string | null;
  destinationUrl: string;
  address?: string;
}

/**
 * Resolves any Google Maps link (maps.app.goo.gl, goo.gl/maps, google.com/maps/place, etc.)
 * into a direct 5-star Google Review URL: https://search.google.com/local/writereview?placeid=...
 */
export async function resolveGoogleMapsPlaceDetails(inputUrl: string): Promise<ResolvedPlaceDetails> {
  let cleanUrl = inputUrl.trim();
  if (!/^https?:\/\//i.test(cleanUrl)) {
    cleanUrl = `https://${cleanUrl}`;
  }

  let finalUrl = cleanUrl;

  // 1. Direct placeid in input URL
  const initialPidMatch = cleanUrl.match(/[?&]placeid=([a-zA-Z0-9_-]+)/i) || cleanUrl.match(/(ChIJ[a-zA-Z0-9_-]{20,})/i);
  let placeId: string | null = initialPidMatch ? initialPidMatch[1] : null;

  try {
    const response = await fetch(cleanUrl, { 
      redirect: 'follow', 
      headers: { 
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7'
      },
      signal: AbortSignal.timeout(6000),
    });
    
    // Only use response.url if it doesn't redirect to Google login/accounts
    if (response.url && !response.url.includes('accounts.google.com')) {
      finalUrl = response.url;
    }
  } catch (error) {
    console.warn('[resolveGoogleMapsPlaceDetails] Redirect follow warning:', error);
  }

  // 2. Extract place name from URL path /maps/place/Nama+Usaha/@...
  let name = '';
  const placePathMatch = finalUrl.match(/\/maps\/place\/([^/@?]+)/i) || cleanUrl.match(/\/maps\/place\/([^/@?]+)/i);
  if (placePathMatch && placePathMatch[1]) {
    try {
      name = decodeURIComponent(placePathMatch[1].replace(/\+/g, ' '));
    } catch {
      name = placePathMatch[1].replace(/\+/g, ' ');
    }
  }

  // If no name from path, check query param q=...
  if (!name) {
    const qMatch = finalUrl.match(/[?&]q=([^&]+)/i) || cleanUrl.match(/[?&]q=([^&]+)/i) || finalUrl.match(/\/maps\/search\/([^/?]+)/i);
    if (qMatch && qMatch[1]) {
      try {
        name = decodeURIComponent(qMatch[1].replace(/\+/g, ' '));
      } catch {
        name = qMatch[1].replace(/\+/g, ' ');
      }
    }
  }

  // 3. Extract placeId if not found yet
  if (!placeId) {
    const finalPidMatch = finalUrl.match(/[?&]placeid=([a-zA-Z0-9_-]+)/i) || finalUrl.match(/(ChIJ[a-zA-Z0-9_-]{20,})/i);
    if (finalPidMatch) {
      placeId = finalPidMatch[1];
    }
  }

  // 4. Extract from hex FTID (0x...:0x...)
  if (!placeId) {
    const ftidMatch = finalUrl.match(/!1s(0x[0-9a-f]+:0x[0-9a-f]+)/i) || 
                      cleanUrl.match(/!1s(0x[0-9a-f]+:0x[0-9a-f]+)/i) ||
                      finalUrl.match(/(0x[0-9a-f]{10,}:0x[0-9a-f]{10,})/i);
    if (ftidMatch && ftidMatch[1]) {
      placeId = extractPlaceIdFromFtid(ftidMatch[1]);
    }
  }

  // 5. Build Direct 5-Star Write Review URL
  let destinationUrl = finalUrl;
  if (placeId) {
    destinationUrl = `https://search.google.com/local/writereview?placeid=${placeId}`;
  } else if (finalUrl.includes('google.com/maps/place/')) {
    const urlObj = new URL(finalUrl);
    if (!urlObj.pathname.endsWith('/review')) {
      urlObj.pathname = urlObj.pathname.endsWith('/') 
        ? `${urlObj.pathname}review` 
        : `${urlObj.pathname}/review`;
    }
    destinationUrl = urlObj.toString();
  } else if (name && name !== 'Lokasi Google Maps') {
    destinationUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name)}`;
  }

  return {
    name: name || 'Usaha Google Maps',
    placeId,
    destinationUrl,
    address: 'Terverifikasi dari tautan Google Maps',
  };
}

export async function resolveGoogleMapsReviewUrl(inputUrl: string): Promise<string> {
  try {
    if (!inputUrl.includes('google.com') && !inputUrl.includes('goo.gl') && !inputUrl.includes('g.page')) {
      return inputUrl;
    }

    const details = await resolveGoogleMapsPlaceDetails(inputUrl);
    return details.destinationUrl || inputUrl;
  } catch (error) {
    console.error('Error resolving Google Maps URL:', error);
    return inputUrl;
  }
}
