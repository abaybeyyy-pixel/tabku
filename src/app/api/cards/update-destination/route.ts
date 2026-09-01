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
    const { cardId, pin, placeId, businessName, businessAddress } = body;

    if (!cardId || !pin) {
      return NextResponse.json({ error: 'ID Kartu dan PIN wajib diisi.' }, { status: 400 });
    }

    if (!placeId && (!businessName || businessName.trim().length === 0)) {
      return NextResponse.json({ error: 'Nama bisnis atau lokasi baru wajib diisi.' }, { status: 400 });
    }

    const card = await findCardById(cardId.toUpperCase());
    if (!card || card.status !== 'ACTIVE' || !card.pin_hash) {
      return NextResponse.json({ error: 'Kartu tidak ditemukan atau belum aktif.' }, { status: 404 });
    }

    const pinValid = await verifyPin(pin, card.pin_hash);
    if (!pinValid) {
      return NextResponse.json({ error: 'PIN yang Anda masukkan salah.' }, { status: 401 });
    }

    // Generate Google Review URL if placeId provided
    const destinationUrl = placeId ? `https://search.google.com/local/writereview?placeid=${placeId}` : undefined;

    const success = await updateDestination(
      cardId.toUpperCase(),
      destinationUrl,
      placeId || undefined,
      businessName?.trim(),
      businessAddress?.trim()
    );

    if (!success) {
      return NextResponse.json({ error: 'Gagal memperbarui data bisnis.' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Data bisnis berhasil diperbarui.',
      card: {
        businessName: businessName?.trim() || card.business_name,
        businessAddress: businessAddress?.trim() || card.business_address,
        placeId: placeId || card.place_id,
        destinationUrl: destinationUrl || card.destination_url,
      }
    });
  } catch {
    return NextResponse.json({ error: 'Terjadi kesalahan sistem.' }, { status: 500 });
  }
}
