import { NextRequest, NextResponse } from 'next/server';
import { findCardById, activateCard } from '@/lib/db-helpers';
import { hashPin, isValidPin, isValidEmail } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { cardId, businessName, placeId, businessAddress, email, pin, confirmPin } = body;

    // Validate card ID
    if (!cardId) {
      return NextResponse.json({ error: 'Card ID is required.' }, { status: 400 });
    }

    const card = await findCardById(cardId);
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

    // Validate destination: either Google Review Place ID or Custom URL
    let destinationUrl = '';
    const isCustomLink = linkType === 'custom_url' || (!!customUrl && !placeId);

    if (isCustomLink) {
      if (!customUrl || customUrl.trim().length === 0) {
        return NextResponse.json({ error: 'URL tujuan wajib diisi untuk link custom.' }, { status: 400 });
      }
      let formattedUrl = customUrl.trim();
      if (!/^https?:\/\//i.test(formattedUrl)) {
        formattedUrl = `https://${formattedUrl}`;
      }
      try {
        new URL(formattedUrl);
      } catch {
        return NextResponse.json({ error: 'Format URL tidak valid. Masukkan URL yang benar (contoh: https://instagram.com/tokoanda).' }, { status: 400 });
      }
      destinationUrl = formattedUrl;
    } else {
      if (!placeId || placeId.trim().length === 0) {
        return NextResponse.json({ error: 'Silakan cari dan pilih lokasi bisnis Google Maps.' }, { status: 400 });
      }
      destinationUrl = `https://search.google.com/local/writereview?placeid=${placeId}`;
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

    const success = await activateCard(
      cardId,
      businessName.trim(),
      destinationUrl,
      pinHash,
      email.trim().toLowerCase(),
      isCustomLink ? undefined : placeId,
      isCustomLink ? undefined : businessAddress?.trim()
    );

    if (!success) {
      return NextResponse.json({ error: 'Failed to activate card. Please try again.' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Kartu Anda Berhasil Diaktifkan!',
      card: {
        cardId,
        businessName: businessName.trim(),
        businessAddress: isCustomLink ? '' : (businessAddress?.trim() || ''),
        placeId: isCustomLink ? null : placeId,
        destinationUrl,
        linkType: isCustomLink ? 'custom_url' : 'google_review',
        status: 'ACTIVE',
      },
    });
  } catch {
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
  }
}
