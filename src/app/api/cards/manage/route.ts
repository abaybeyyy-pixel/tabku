import { NextRequest, NextResponse } from 'next/server';
import { findCardById } from '@/lib/db-helpers';
import { verifyPin } from '@/lib/auth';
import { checkRateLimit, getRateLimitKey } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const rateLimitKey = getRateLimitKey(ip, 'manage');
    const rateLimit = checkRateLimit(rateLimitKey, 5, 15 * 60 * 1000);

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many attempts. Please try again later.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { cardId, pin } = body;

    if (!cardId || !pin) {
      return NextResponse.json({ error: 'Card ID and PIN are required.' }, { status: 400 });
    }

    const card = await findCardById(cardId.toUpperCase());
    if (!card) {
      return NextResponse.json({ error: 'Card not found.' }, { status: 404 });
    }

    if (card.status === 'UNACTIVATED') {
      return NextResponse.json({ error: 'Card has not been activated yet.' }, { status: 400 });
    }

    if (!card.pin_hash) {
      return NextResponse.json({ error: 'Card PIN not configured.' }, { status: 400 });
    }

    const pinValid = await verifyPin(pin, card.pin_hash);
    if (!pinValid) {
      return NextResponse.json({ error: 'Incorrect PIN.' }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      card: {
        cardId: card.card_id,
        businessName: card.business_name,
        destinationUrl: card.destination_url,
        status: card.status,
        email: card.email,
        activatedAt: card.activated_at,
        updatedAt: card.updated_at,
      },
    });
  } catch {
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
  }
}
