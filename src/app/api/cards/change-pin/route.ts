import { NextRequest, NextResponse } from 'next/server';
import { findCardById, updatePin } from '@/lib/db-helpers';
import { verifyPin, hashPin, isValidPin } from '@/lib/auth';
import { checkRateLimit, getRateLimitKey } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const rateLimit = checkRateLimit(getRateLimitKey(ip, 'change-pin'), 5, 15 * 60 * 1000);
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: 'Too many attempts. Please try again later.' }, { status: 429 });
    }

    const body = await request.json();
    const { cardId, currentPin, newPin, confirmNewPin } = body;

    if (!cardId || !currentPin || !newPin || !confirmNewPin) {
      return NextResponse.json({ error: 'All fields are required.' }, { status: 400 });
    }

    if (!isValidPin(newPin)) {
      return NextResponse.json({ error: 'New PIN must be 4-6 digits.' }, { status: 400 });
    }

    if (newPin !== confirmNewPin) {
      return NextResponse.json({ error: 'New PINs do not match.' }, { status: 400 });
    }

    const card = findCardById(cardId.toUpperCase());
    if (!card || card.status !== 'ACTIVE' || !card.pin_hash) {
      return NextResponse.json({ error: 'Card not found or not active.' }, { status: 404 });
    }

    const pinValid = await verifyPin(currentPin, card.pin_hash);
    if (!pinValid) {
      return NextResponse.json({ error: 'Current PIN is incorrect.' }, { status: 401 });
    }

    const newPinHash = await hashPin(newPin);
    const success = updatePin(cardId.toUpperCase(), newPinHash);
    if (!success) {
      return NextResponse.json({ error: 'Failed to update PIN.' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'PIN changed successfully.' });
  } catch {
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
  }
}
