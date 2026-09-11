import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, getRateLimitKey } from '@/lib/rate-limit';
import { resolveGoogleMapsPlaceDetails } from '@/lib/url-resolver';

interface PlaceItem {
  placeId: string;
  name: string;
  address: string;
  destinationUrl?: string;
  source?: 'google' | 'url' | 'osm' | 'direct';
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

    // 2. Google Places API (New) & Legacy Text Search
    const apiKeys = [
      process.env.GOOGLE_MAPS_API_KEY,
      process.env.GOOGLE_MAPS_API_KEY_SECONDARY,
      process.env.GOOGLE_MAPS_API_KEY_BACKUP,
      'AIzaSyDWEUKKxHlbDiFygALenir_Wv_Rc1DuCjQ',
      'AIzaSyAPBT5dAB_-g5qkasSRYWtAbrNPHeZgVdc',
    ].filter((k): k is string => !!k && typeof k === 'string' && k.trim().length > 0);

    for (const apiKey of apiKeys) {
      // 2a. Try Google Places API (New)
      try {
        const responseNew = await fetch('https://places.googleapis.com/v1/places:searchText', {
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

        if (responseNew.ok) {
          const dataNew = await responseNew.json();
          if (Array.isArray(dataNew.places) && dataNew.places.length > 0) {
            const results: PlaceItem[] = dataNew.places.map(
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
          const errBody = await responseNew.text().catch(() => '');
          console.warn(`[Google Places API New] Key failed (${responseNew.status}):`, errBody);
        }
      } catch (errNew) {
        console.warn('[Google Places API New Error]:', errNew);
      }

      // 2b. Try Google Places API (Legacy Text Search)
      try {
        const legacyUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(trimmedQuery)}&region=id&language=id&key=${apiKey}`;
        const responseLegacy = await fetch(legacyUrl, { signal: AbortSignal.timeout(5000) });
        if (responseLegacy.ok) {
          const dataLegacy = await responseLegacy.json();
          if (dataLegacy.status === 'OK' && Array.isArray(dataLegacy.results) && dataLegacy.results.length > 0) {
            const results: PlaceItem[] = dataLegacy.results.slice(0, 6).map(
              (place: { place_id: string; name: string; formatted_address?: string }) => ({
                placeId: place.place_id,
                name: place.name || trimmedQuery,
                address: place.formatted_address || 'Indonesia',
                destinationUrl: `https://search.google.com/local/writereview?placeid=${place.place_id}`,
                source: 'google',
              })
            );
            return NextResponse.json({ results, source: 'google' });
          }
        }
      } catch (errLegacy) {
        console.warn('[Google Places Legacy Error]:', errLegacy);
      }
    }

    // 3. Fallback: Search commercial establishments & clean query match
    const fallbackResults: PlaceItem[] = [];

    try {
      const osmRes = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(trimmedQuery)}&countrycodes=id&limit=8&addressdetails=1`,
        {
          headers: { 'User-Agent': 'MycarrdTapkuApp/1.0 (contact: support@mycarrd.com)' },
          signal: AbortSignal.timeout(4000),
        }
      );

      if (osmRes.ok) {
        const osmData = await osmRes.json();
        if (Array.isArray(osmData)) {
          for (const item of osmData) {
            // FILTER OUT villages, hamlets, islands, admin boundaries that are NOT businesses
            const isNonBusinessAdminPlace = 
              item.class === 'place' && 
              ['village', 'hamlet', 'isolated_dwelling', 'suburb', 'county', 'state', 'country', 'island', 'administrative'].includes(item.type);
            
            if (isNonBusinessAdminPlace) {
              continue; // Skip villages like "Desa Kenangan"
            }

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

    // Always provide the clean direct search entry for the exact name
    fallbackResults.push({
      placeId: `direct:${encodeURIComponent(trimmedQuery)}`,
      name: trimmedQuery,
      address: `Cari di Google Maps: "${trimmedQuery}"`,
      destinationUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(trimmedQuery)}`,
      source: 'direct',
    });

    return NextResponse.json({
      results: fallbackResults,
      isFallback: true,
    });
  } catch (error) {
    console.error('Places search unhandled error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan saat mencari bisnis.' }, { status: 500 });
  }
}
