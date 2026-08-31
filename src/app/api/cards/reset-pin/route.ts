import { NextRequest, NextResponse } from 'next/server';
import { findCardById, getLatestOtp, markOtpUsed, updatePin } from '@/lib/db-helpers';
import { verifyPin, hashPin, isValidPin } from '@/lib/auth';
import { checkRateLimit, getRateLimitKey } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const rateLimit = checkRateLimit(getRateLimitKey(ip, 'reset-pin'), 5, 15 * 60 * 1000);
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: 'Too many attempts. Please try again later.' }, { status: 429 });
    }

    const body = await request.json();
    const { cardId, otp, newPin, confirmNewPin } = body;

    if (!cardId || !otp || !newPin || !confirmNewPin) {
      return NextResponse.json({ error: 'All fields are required.' }, { status: 400 });
    }

    if (!isValidPin(newPin)) {
      return NextResponse.json({ error: 'New PIN must be 4-6 digits.' }, { status: 400 });
    }

    if (newPin !== confirmNewPin) {
      return NextResponse.json({ error: 'New PINs do not match.' }, { status: 400 });
    }

    const card = await findCardById(cardId.toUpperCase());
    if (!card) {
      return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
    }

    const otpRecord = await getLatestOtp(cardId.toUpperCase());
    if (!otpRecord) {
      return NextResponse.json({ error: 'No valid OTP found. Please request a new one.' }, { status: 400 });
    }

    const otpValid = await verifyPin(otp, otpRecord.otp_hash);
    if (!otpValid) {
      return NextResponse.json({ error: 'Invalid OTP code.' }, { status: 401 });
    }

    // Mark OTP as used
    await markOtpUsed(otpRecord.id);

    // Update PIN
    const newPinHash = await hashPin(newPin);
    const success = await updatePin(cardId.toUpperCase(), newPinHash);
    if (!success) {
      return NextResponse.json({ error: 'Failed to reset PIN.' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'PIN has been reset successfully.' });
  } catch {
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
  }
}
