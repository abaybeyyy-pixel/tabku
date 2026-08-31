import { NextRequest, NextResponse } from 'next/server';
import { findCardById, activateCard } from '@/lib/db-helpers';
import { hashPin, isValidPin, isValidGoogleReviewUrl, isValidEmail } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { cardId, businessName, destinationUrl, pin, confirmPin, email } = body;

    // Validate card ID
    if (!cardId) {
      return NextResponse.json({ error: 'Card ID is required.' }, { status: 400 });
    }

    const card = findCardById(cardId);
    if (!card) {
      return NextResponse.json({ error: 'Card not found.' }, { status: 404 });
    }

    if (card.status !== 'UNACTIVATED') {
      return NextResponse.json({ error: 'Card is already activated.' }, { status: 400 });
    }

    // Validate business name
    if (!businessName || businessName.trim().length === 0) {
      return NextResponse.json({ error: 'Business name is required.' }, { status: 400 });
    }

    // Validate destination URL
    if (!destinationUrl || !isValidGoogleReviewUrl(destinationUrl)) {
      return NextResponse.json({ error: 'Please enter a valid Google Review URL.' }, { status: 400 });
    }

    // Validate email
    if (!email || !isValidEmail(email)) {
      return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
    }

    // Validate PIN
    if (!pin || !isValidPin(pin)) {
      return NextResponse.json({ error: 'PIN must be 4-6 digits.' }, { status: 400 });
    }

    if (pin !== confirmPin) {
      return NextResponse.json({ error: 'PINs do not match.' }, { status: 400 });
    }

    // Hash PIN and activate
    const pinHash = await hashPin(pin);
    const success = activateCard(cardId, businessName.trim(), destinationUrl.trim(), pinHash, email.trim().toLowerCase());

    if (!success) {
      return NextResponse.json({ error: 'Failed to activate card. Please try again.' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Your Review Card is Ready!',
      card: {
        cardId,
        businessName: businessName.trim(),
        status: 'ACTIVE',
      },
    });
  } catch {
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
  }
}
