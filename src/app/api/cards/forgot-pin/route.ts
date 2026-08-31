import { NextRequest, NextResponse } from 'next/server';
import { findCardById, storeOtp } from '@/lib/db-helpers';
import { generateOtp, hashPin, isValidEmail } from '@/lib/auth';
import { checkRateLimit, getRateLimitKey } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const rateLimit = checkRateLimit(getRateLimitKey(ip, 'forgot-pin'), 3, 60 * 60 * 1000); // 3 per hour
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
    }

    const body = await request.json();
    const { cardId, email } = body;

    if (!cardId || !email) {
      return NextResponse.json({ error: 'Card ID and email are required.' }, { status: 400 });
    }

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
    }

    const card = findCardById(cardId.toUpperCase());

    // Always return success to prevent email enumeration
    // But only actually send OTP if card exists and email matches
    if (card && card.email && card.email.toLowerCase() === email.trim().toLowerCase()) {
      const otp = generateOtp();
      const otpHash = await hashPin(otp);
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 min expiry

      storeOtp(card.card_id, otpHash, expiresAt);

      // In production, send email via SMTP
      // For MVP, log to console
      console.log(`[OTP] Card: ${card.card_id}, Email: ${card.email}, OTP: ${otp}`);

      // Attempt to send email (non-blocking for MVP)
      try {
        const nodemailer = require('nodemailer');
        const smtpHost = process.env.SMTP_HOST;
        const smtpUser = process.env.SMTP_USER;
        const smtpPass = process.env.SMTP_PASS;

        if (smtpHost && smtpUser && smtpPass) {
          const transporter = nodemailer.createTransport({
            host: smtpHost,
            port: parseInt(process.env.SMTP_PORT || '587'),
            secure: false,
            auth: { user: smtpUser, pass: smtpPass },
          });

          await transporter.sendMail({
            from: process.env.SMTP_FROM || 'noreply@tapku.com',
            to: card.email,
            subject: 'Your PIN Reset Code',
            text: `Your PIN reset code is: ${otp}\n\nThis code expires in 10 minutes.\n\nIf you did not request this, please ignore this email.`,
            html: `<div style="font-family:sans-serif;max-width:400px;margin:0 auto;padding:20px"><h2>PIN Reset Code</h2><p>Your PIN reset code is:</p><div style="font-size:32px;font-weight:bold;letter-spacing:8px;text-align:center;padding:20px;background:#f5f5f5;border-radius:8px;margin:20px 0">${otp}</div><p style="color:#666;font-size:14px">This code expires in 10 minutes. If you did not request this, please ignore this email.</p></div>`,
          });
        }
      } catch (emailError) {
        console.error('[Email Error]', emailError);
        // Don't fail the request if email fails
      }
    }

    return NextResponse.json({
      success: true,
      message: 'If the card ID and email match our records, you will receive an OTP code.',
    });
  } catch {
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
  }
}
