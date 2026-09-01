import { NextRequest, NextResponse } from 'next/server';
import { findCardById, storeOtp } from '@/lib/db-helpers';
import { generateOtp, hashPin, isValidEmail } from '@/lib/auth';
import { checkRateLimit, recordFailedAttempt, getRateLimitKey } from '@/lib/rate-limit';
import { sendOtpEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      'unknown';

    // Rate limiting: Max 3 OTP requests per 15 minutes per IP
    const rateLimit = checkRateLimit(getRateLimitKey(ip, 'forgot-pin'), 3, 15 * 60 * 1000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: `Terlalu banyak permintaan OTP. Silakan coba lagi dalam ${rateLimit.resetMinutes} menit.`,
        },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { cardId, email } = body;

    if (!cardId || !email) {
      return NextResponse.json(
        { error: 'ID Kartu dan alamat email wajib diisi.' },
        { status: 400 }
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: 'Format alamat email tidak valid.' },
        { status: 400 }
      );
    }

    const normalizedCardId = cardId.trim().toUpperCase();
    const card = await findCardById(normalizedCardId);

    // Always return success response to prevent email / card enumeration attacks
    if (card && card.email && card.email.toLowerCase() === email.trim().toLowerCase()) {
      const otp = generateOtp();
      const otpHash = await hashPin(otp);
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes

      await storeOtp(card.card_id, otpHash, expiresAt);

      // Send OTP via SMTP
      sendOtpEmail({
        to: card.email,
        cardId: card.card_id,
        otp,
        businessName: card.business_name,
      }).catch((err) => {
        console.error('[Background Email Error]', err);
      });
    } else {
      recordFailedAttempt(getRateLimitKey(ip, 'forgot-pin'), 3, 15 * 60 * 1000);
    }

    return NextResponse.json({
      success: true,
      message: 'Jika ID Kartu dan email cocok dengan data terdaftar kami, kode OTP 6 digit telah dikirimkan ke email Anda.',
    });
  } catch (err) {
    console.error('[Forgot PIN Error]', err);
    return NextResponse.json(
      { error: 'Terjadi kesalahan sistem saat memproses permintaan.' },
      { status: 500 }
    );
  }
}
