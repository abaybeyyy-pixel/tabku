function extractPlaceIdFromFtid(ftid: string): string | null {
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

export async function resolveGoogleMapsReviewUrl(inputUrl: string): Promise<string> {
  try {
    // Basic validation
    if (!inputUrl.includes('google.com') && !inputUrl.includes('goo.gl')) {
      return inputUrl; // Not a Google Maps link, return as is
    }

    // Fetch the URL, it will automatically follow redirects
    const response = await fetch(inputUrl, { 
      redirect: 'follow', 
      headers: { 'User-Agent': 'Mozilla/5.0' } 
    });
    
    const finalUrl = response.url;

    // If it's already a review link, return it
    if (finalUrl.includes('/review') || finalUrl.includes('search.google.com/local/writereview')) {
      return finalUrl;
    }

    // Try to extract ftid to generate official Place ID review link
    const ftidMatch = finalUrl.match(/!1s(0x[0-9a-f]+:0x[0-9a-f]+)/i);
    if (ftidMatch && ftidMatch[1]) {
      const placeId = extractPlaceIdFromFtid(ftidMatch[1]);
      if (placeId) {
        return `https://search.google.com/local/writereview?placeid=${placeId}`;
      }
    }

    // Fallback: If it's a google maps place link and no ftid found
    if (finalUrl.includes('google.com/maps/place/')) {
      const urlObj = new URL(finalUrl);
      if (!urlObj.pathname.endsWith('/review')) {
        urlObj.pathname = urlObj.pathname.endsWith('/') 
          ? `${urlObj.pathname}review` 
          : `${urlObj.pathname}/review`;
      }
      return urlObj.toString();
    }

    return finalUrl; // Fallback to whatever the final URL is
  } catch (error) {
    console.error('Error resolving Google Maps URL:', error);
    return inputUrl; // Return original if resolution fails
  }
}
