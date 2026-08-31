import { NextRequest, NextResponse } from 'next/server';
import { findCardById, updateDestination } from '@/lib/db-helpers';
import { verifyPin, isValidGoogleReviewUrl } from '@/lib/auth';
import { checkRateLimit, getRateLimitKey } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const rateLimit = checkRateLimit(getRateLimitKey(ip, 'update-dest'), 10, 15 * 60 * 1000);
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: 'Too many attempts. Please try again later.' }, { status: 429 });
    }

    const body = await request.json();
    const { cardId, pin, newDestinationUrl } = body;

    if (!cardId || !pin) {
      return NextResponse.json({ error: 'Card ID and PIN are required.' }, { status: 400 });
    }

    if (!newDestinationUrl || !isValidGoogleReviewUrl(newDestinationUrl)) {
      return NextResponse.json({ error: 'Please enter a valid URL.' }, { status: 400 });
    }

    const card = findCardById(cardId.toUpperCase());
    if (!card || card.status !== 'ACTIVE' || !card.pin_hash) {
      return NextResponse.json({ error: 'Card not found or not active.' }, { status: 404 });
    }

    const pinValid = await verifyPin(pin, card.pin_hash);
    if (!pinValid) {
      return NextResponse.json({ error: 'Incorrect PIN.' }, { status: 401 });
    }

    const success = updateDestination(cardId.toUpperCase(), newDestinationUrl.trim());
    if (!success) {
      return NextResponse.json({ error: 'Failed to update destination.' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Destination updated successfully.' });
  } catch {
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
  }
}
