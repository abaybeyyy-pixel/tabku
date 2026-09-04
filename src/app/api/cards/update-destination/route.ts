import { NextRequest, NextResponse } from 'next/server';
import { findCardById, updateDestination } from '@/lib/db-helpers';
import { verifyPin } from '@/lib/auth';
import { checkRateLimit, getRateLimitKey } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const rateLimit = checkRateLimit(getRateLimitKey(ip, 'update-dest'), 10, 15 * 60 * 1000);
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: 'Terlalu banyak percobaan. Silakan coba lagi nanti.' }, { status: 429 });
    }

    const body = await request.json();
    const { cardId, pin, placeId, businessName, businessAddress, customUrl, linkType } = body;

    if (!cardId || !pin) {
      return NextResponse.json({ error: 'ID Kartu dan PIN wajib diisi.' }, { status: 400 });
    }

    const isCustomLink = linkType === 'custom_url' || (!!customUrl && !placeId);

    if (!isCustomLink && !placeId && (!businessName || businessName.trim().length === 0)) {
      return NextResponse.json({ error: 'Nama bisnis atau tautan baru wajib diisi.' }, { status: 400 });
    }

    const card = await findCardById(cardId.toUpperCase());
    if (!card || card.status !== 'ACTIVE' || !card.pin_hash) {
      return NextResponse.json({ error: 'Kartu tidak ditemukan atau belum aktif.' }, { status: 404 });
    }

    const pinValid = await verifyPin(pin, card.pin_hash);
    if (!pinValid) {
      return NextResponse.json({ error: 'PIN yang Anda masukkan salah.' }, { status: 401 });
    }

    let destinationUrl: string | undefined = undefined;
    let newPlaceId: string | null | undefined = undefined;
    let newAddress: string | null | undefined = undefined;

    if (isCustomLink) {
      if (!customUrl || customUrl.trim().length === 0) {
        return NextResponse.json({ error: 'URL tujuan wajib diisi.' }, { status: 400 });
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
      newPlaceId = null; // Clear place_id since it's now a custom link
      newAddress = null;
    } else if (placeId) {
      destinationUrl = `https://search.google.com/local/writereview?placeid=${placeId}`;
      newPlaceId = placeId;
      newAddress = businessAddress?.trim() || null;
    }

    const success = await updateDestination(
      cardId.toUpperCase(),
      destinationUrl,
      newPlaceId,
      businessName?.trim(),
      newAddress
    );

    if (!success) {
      return NextResponse.json({ error: 'Gagal memperbarui data bisnis.' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Tujuan kartu berhasil diperbarui.',
      card: {
        businessName: businessName?.trim() || card.business_name,
        businessAddress: newAddress !== undefined ? newAddress : card.business_address,
        placeId: newPlaceId !== undefined ? newPlaceId : card.place_id,
        destinationUrl: destinationUrl || card.destination_url,
      }
    });
  } catch {
    return NextResponse.json({ error: 'Terjadi kesalahan sistem.' }, { status: 500 });
  }
}
