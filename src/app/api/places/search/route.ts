import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, getRateLimitKey } from '@/lib/rate-limit';
import { resolveGoogleMapsPlaceDetails } from '@/lib/url-resolver';

interface PlaceItem {
  placeId: string;
  name: string;
  address: string;
  destinationUrl?: string;
  source?: 'google' | 'url' | 'osm' | 'direct';
  isDirect?: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const rateLimit = checkRateLimit(getRateLimitKey(ip, 'places-search'), 30, 15 * 60 * 1000);
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: 'Terlalu banyak pencarian. Coba lagi nanti.' }, { status: 429 });
    }

    const { query } = await request.json();

    if (!query || typeof query !== 'string' || query.trim().length < 2) {
      return NextResponse.json({ error: 'Masukkan minimal 2 karakter untuk mencari bisnis.' }, { status: 400 });
    }

    const trimmedQuery = query.trim();

    // 1. Direct Google Maps URL handling (Link paste support)
    const isUrl = /^https?:\/\//i.test(trimmedQuery) || 
      trimmedQuery.includes('google.com/maps') || 
      trimmedQuery.includes('goo.gl') || 
      trimmedQuery.includes('maps.app.goo.gl');

    if (isUrl) {
      try {
        const details = await resolveGoogleMapsPlaceDetails(trimmedQuery);
        const resolvedResult: PlaceItem = {
          placeId: details.placeId || details.destinationUrl,
          name: details.name,
          address: details.address || 'Terverifikasi dari tautan Google Maps',
          destinationUrl: details.destinationUrl,
          source: 'url',
        };
        return NextResponse.json({ results: [resolvedResult], isUrl: true });
      } catch (urlErr) {
        console.warn('[Places Search] URL resolution warning:', urlErr);
      }
    }

    // 2. Attempt Google Places API (New) if API Key is configured
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (apiKey) {
      try {
        const response = await fetch('https://places.googleapis.com/v1/places:searchText', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': apiKey,
            'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress',
          },
          body: JSON.stringify({
            textQuery: trimmedQuery,
            maxResultCount: 6,
            regionCode: 'ID',
            languageCode: 'id',
          }),
          signal: AbortSignal.timeout(5000),
        });

        if (response.ok) {
          const data = await response.json();
          if (Array.isArray(data.places) && data.places.length > 0) {
            const results: PlaceItem[] = data.places.map(
              (place: { id: string; displayName?: { text?: string }; formattedAddress?: string }) => ({
                placeId: place.id,
                name: place.displayName?.text || trimmedQuery,
                address: place.formattedAddress || 'Indonesia',
                destinationUrl: `https://search.google.com/local/writereview?placeid=${place.id}`,
                source: 'google',
              })
            );
            return NextResponse.json({ results, source: 'google' });
          }
        } else {
          const errorData = await response.json().catch(() => ({}));
          console.warn('[Google Places API Warning]', response.status, errorData?.error?.message || errorData);
        }
      } catch (googleErr) {
        console.warn('[Google Places API Error] Falling back to alternative search:', googleErr);
      }
    }

    // 3. Resilient Fallback: OpenStreetMap (Nominatim) for Indonesia + Direct Query Option
    const fallbackResults: PlaceItem[] = [];

    try {
      const osmRes = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(trimmedQuery)}&countrycodes=id&limit=5&addressdetails=1`,
        {
          headers: { 'User-Agent': 'MycarrdTapkuApp/1.0 (contact: support@mycarrd.com)' },
          signal: AbortSignal.timeout(4000),
        }
      );

      if (osmRes.ok) {
        const osmData = await osmRes.json();
        if (Array.isArray(osmData)) {
          for (const item of osmData) {
            const name = item.name || (item.display_name ? item.display_name.split(',')[0] : trimmedQuery);
            fallbackResults.push({
              placeId: `direct:${encodeURIComponent(name + ' ' + item.display_name)}`,
              name,
              address: item.display_name || 'Indonesia',
              destinationUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name + ' ' + item.display_name)}`,
              source: 'osm',
            });
          }
        }
      }
    } catch (osmErr) {
      console.warn('[Places Search Fallback Warning]', osmErr);
    }

    // Always include a guaranteed direct match option so the user is NEVER blocked
    fallbackResults.push({
      placeId: `direct:${encodeURIComponent(trimmedQuery)}`,
      name: trimmedQuery,
      address: `Gunakan ulasan Google Maps untuk "${trimmedQuery}"`,
      destinationUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(trimmedQuery)}`,
      source: 'direct',
      isDirect: true,
    });

    return NextResponse.json({
      results: fallbackResults,
      isFallback: true,
      message: 'Saran lokasi ditampilkan. Anda juga dapat menempelkan link Google Maps langsung.',
    });
  } catch (error) {
    console.error('Places search unhandled error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan saat mencari bisnis.' }, { status: 500 });
  }
}
