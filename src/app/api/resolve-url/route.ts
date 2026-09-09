import { NextRequest, NextResponse } from 'next/server';
import { resolveGoogleMapsPlaceDetails } from '@/lib/url-resolver';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const url = body.url || body.query;
    if (!url || typeof url !== 'string' || !url.trim()) {
      return NextResponse.json({ error: 'URL Google Maps wajib diisi.' }, { status: 400 });
    }

    const details = await resolveGoogleMapsPlaceDetails(url.trim());
    return NextResponse.json({
      success: true,
      name: details.name,
      placeId: details.placeId,
      destinationUrl: details.destinationUrl,
      address: details.address,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal memproses URL Google Maps.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
