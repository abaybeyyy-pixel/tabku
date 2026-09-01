import { NextRequest, NextResponse } from 'next/server';
import { findCardById } from '@/lib/db-helpers';
import { verifyPin } from '@/lib/auth';
import {
  checkRateLimit,
  recordFailedAttempt,
  clearRateLimit,
  getRateLimitKey,
} from '@/lib/rate-limit';

const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_WINDOW_MS = 15 * 60 * 1000; // 15 menit

export async function POST(request: NextRequest) {
  try {
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      'unknown';

    // 1. Check IP-level rate limit
    const ipLimitKey = getRateLimitKey(ip, 'manage-ip');
    const ipRateLimit = checkRateLimit(ipLimitKey, MAX_LOGIN_ATTEMPTS * 3, LOCKOUT_WINDOW_MS);

    if (!ipRateLimit.allowed) {
      return NextResponse.json(
        {
          error: `Terlalu banyak percobaan gagal dari perangkat Anda. Silakan coba lagi dalam ${ipRateLimit.resetMinutes} menit.`,
        },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { cardId, pin } = body;

    if (!cardId || !pin) {
      return NextResponse.json(
        { error: 'ID Kartu dan PIN wajib diisi.' },
        { status: 400 }
      );
    }

    const normalizedCardId = cardId.trim().toUpperCase();
    const cardLimitKey = getRateLimitKey(normalizedCardId, 'manage-card');

    // 2. Check Card ID-level rate limit (Anti-bruteforce specific card)
    const cardRateLimit = checkRateLimit(cardLimitKey, MAX_LOGIN_ATTEMPTS, LOCKOUT_WINDOW_MS);

    if (!cardRateLimit.allowed) {
      return NextResponse.json(
        {
          error: `Akses kartu ${normalizedCardId} dikunci sementara karena beberapa kali salah PIN. Silakan coba lagi dalam ${cardRateLimit.resetMinutes} menit atau gunakan fitur Lupa PIN.`,
        },
        { status: 429 }
      );
    }

    const card = await findCardById(normalizedCardId);
    if (!card) {
      recordFailedAttempt(ipLimitKey, MAX_LOGIN_ATTEMPTS * 3, LOCKOUT_WINDOW_MS);
      return NextResponse.json(
        { error: `ID Kartu ${normalizedCardId} tidak ditemukan di sistem.` },
        { status: 404 }
      );
    }

    if (card.status === 'UNACTIVATED') {
      return NextResponse.json(
        { error: 'Kartu ini belum diaktivasi. Silakan lakukan aktivasi terlebih dahulu.' },
        { status: 400 }
      );
    }

    if (card.status === 'DISABLED') {
      return NextResponse.json(
        { error: 'Kartu ini dalam status dinonaktifkan. Hubungi admin untuk bantuan.' },
        { status: 403 }
      );
    }

    if (!card.pin_hash) {
      return NextResponse.json(
        { error: 'PIN kartu belum dikonfigurasi. Silakan hubungi admin.' },
        { status: 400 }
      );
    }

    // 3. Verify PIN
    const pinValid = await verifyPin(pin, card.pin_hash);

    if (!pinValid) {
      const cardAttempt = recordFailedAttempt(cardLimitKey, MAX_LOGIN_ATTEMPTS, LOCKOUT_WINDOW_MS);
      recordFailedAttempt(ipLimitKey, MAX_LOGIN_ATTEMPTS * 3, LOCKOUT_WINDOW_MS);

      if (cardAttempt.isLockedOut) {
        return NextResponse.json(
          {
            error: `PIN salah. Anda telah mencapai batas maksimal percobaan. Akun dikunci selama ${cardAttempt.resetMinutes} menit.`,
          },
          { status: 429 }
        );
      }

      return NextResponse.json(
        {
          error: `PIN salah. Sisa ${cardAttempt.remaining}x percobaan sebelum kartu dikunci sementara.`,
        },
        { status: 401 }
      );
    }

    // 4. Success: Clear rate limits for this card
    clearRateLimit(cardLimitKey);

    return NextResponse.json({
      success: true,
      card: {
        cardId: card.card_id,
        businessName: card.business_name,
        destinationUrl: card.destination_url,
        placeId: card.place_id,
        businessAddress: card.business_address,
        status: card.status,
        email: card.email,
        tapCount: Number(card.tap_count) || 0,
        lastTappedAt: card.last_tapped_at || null,
        activatedAt: card.activated_at,
        updatedAt: card.updated_at,
      },
    });
  } catch (err) {
    console.error('[Manage Login Error]', err);
    return NextResponse.json(
      { error: 'Terjadi kesalahan sistem. Silakan coba lagi.' },
      { status: 500 }
    );
  }
}
