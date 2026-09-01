import { NextRequest, NextResponse } from 'next/server';
import { findCardById, updateDestination } from '@/lib/db-helpers';
import { verifyPin } from '@/lib/auth';
import { checkRateLimit, getRateLimitKey } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const rateLimit = checkRateLimit(getRateLimitKey(ip, 'update-dest'), 10, 15 * 60 * 1000);
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: 'Too many attempts. Please try again later.' }, { status: 429 });
    }

    const body = await request.json();
    const { cardId, pin, placeId, businessName, businessAddress } = body;

    if (!cardId || !pin) {
      return NextResponse.json({ error: 'Card ID and PIN are required.' }, { status: 400 });
    }

    if (!placeId || placeId.trim().length === 0) {
      return NextResponse.json({ error: 'Please search and select a business.' }, { status: 400 });
    }

    const card = await findCardById(cardId.toUpperCase());
    if (!card || card.status !== 'ACTIVE' || !card.pin_hash) {
      return NextResponse.json({ error: 'Card not found or not active.' }, { status: 404 });
    }

    const pinValid = await verifyPin(pin, card.pin_hash);
    if (!pinValid) {
      return NextResponse.json({ error: 'Incorrect PIN.' }, { status: 401 });
    }

    // Generate Google Review URL from Place ID
    const destinationUrl = `https://search.google.com/local/writereview?placeid=${placeId}`;

    const success = await updateDestination(
      cardId.toUpperCase(),
      destinationUrl,
      placeId,
      businessName?.trim(),
      businessAddress?.trim()
    );

    if (!success) {
      return NextResponse.json({ error: 'Failed to update destination.' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Bisnis berhasil diperbarui.' });
  } catch {
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
  }
}
