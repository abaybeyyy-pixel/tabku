import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, getRateLimitKey } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const rateLimit = checkRateLimit(getRateLimitKey(ip, 'places-search'), 20, 15 * 60 * 1000);
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: 'Terlalu banyak pencarian. Coba lagi nanti.' }, { status: 429 });
    }

    const { query } = await request.json();

    if (!query || typeof query !== 'string' || query.trim().length < 2) {
      return NextResponse.json({ error: 'Masukkan minimal 2 karakter untuk mencari bisnis.' }, { status: 400 });
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      console.error('GOOGLE_MAPS_API_KEY is not configured');
      return NextResponse.json({ error: 'Pencarian bisnis belum dikonfigurasi.' }, { status: 500 });
    }

    const response = await fetch('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress',
      },
      body: JSON.stringify({
        textQuery: query.trim(),
        maxResultCount: 5,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Google Places API error:', response.status, errorData);
      return NextResponse.json({ error: 'Gagal mencari bisnis. Coba lagi.' }, { status: 502 });
    }

    const data = await response.json();

    const results = (data.places || []).map((place: { id: string; displayName?: { text?: string }; formattedAddress?: string }) => ({
      placeId: place.id,
      name: place.displayName?.text || '',
      address: place.formattedAddress || '',
    }));

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Places search error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan saat mencari bisnis.' }, { status: 500 });
  }
}
