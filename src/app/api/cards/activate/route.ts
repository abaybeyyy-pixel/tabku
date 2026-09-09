import { NextRequest, NextResponse } from 'next/server';
import { findCardById, activateCard } from '@/lib/db-helpers';
import { hashPin, isValidPin, isValidEmail, isValidPhone } from '@/lib/auth';
import { resolveGoogleMapsReviewUrl } from '@/lib/url-resolver';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { cardId, businessName, placeId, businessAddress, customUrl, linkType, email, phone, whatsapp, pin, confirmPin } = body;

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

    // Validate destination: either Google Review Place ID, Direct Google Review URL, or Custom URL
    let destinationUrl = '';
    const isCustomLink = linkType === 'custom_url';

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
      if ((!placeId || placeId.trim().length === 0) && (!customUrl || customUrl.trim().length === 0) && (!businessName || businessName.trim().length === 0)) {
        return NextResponse.json({ error: 'Silakan cari dan pilih lokasi bisnis Google Maps atau masukkan link Google Maps.' }, { status: 400 });
      }

      if (placeId?.startsWith('direct:')) {
        const queryParam = decodeURIComponent(placeId.replace('direct:', ''));
        destinationUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(queryParam)}`;
      } else if (placeId?.startsWith('http://') || placeId?.startsWith('https://')) {
        destinationUrl = await resolveGoogleMapsReviewUrl(placeId);
      } else if (placeId) {
        destinationUrl = `https://search.google.com/local/writereview?placeid=${placeId}`;
      } else if (customUrl) {
        destinationUrl = await resolveGoogleMapsReviewUrl(customUrl);
      } else {
        destinationUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(businessName.trim())}`;
      }
    }

    // Validate WhatsApp number / contact (accepts phone or legacy email)
    const contact = (phone || whatsapp || email || '').trim();
    if (!contact) {
      return NextResponse.json({ error: 'Nomor WhatsApp pemilik wajib diisi.' }, { status: 400 });
    }
    if (!isValidPhone(contact) && !isValidEmail(contact)) {
      return NextResponse.json({ error: 'Nomor WhatsApp tidak valid. Masukkan nomor HP aktif (contoh: 081234567890).' }, { status: 400 });
    }

    // Validate PIN
    if (!pin || !isValidPin(pin)) {
      return NextResponse.json({ error: 'PIN harus 4-6 digit angka.' }, { status: 400 });
    }

    if (pin !== confirmPin) {
      return NextResponse.json({ error: 'Konfirmasi PIN tidak cocok.' }, { status: 400 });
    }

    // Hash PIN and activate
    const pinHash = await hashPin(pin);

    const success = await activateCard(
      cardId,
      businessName.trim(),
      destinationUrl,
      pinHash,
      contact,
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
