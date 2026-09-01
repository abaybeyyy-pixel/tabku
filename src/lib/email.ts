import nodemailer from 'nodemailer';

export interface SendOtpParams {
  to: string;
  cardId: string;
  otp: string;
  businessName?: string | null;
}

export interface SmtpTestResult {
  success: boolean;
  message: string;
  details?: {
    host: string;
    port: number;
    user: string;
    from: string;
    secure: boolean;
  };
  error?: string;
}

/**
 * Creates a reusable nodemailer transporter based on environment variables
 */
export function getMailTransporter() {
  const host = process.env.SMTP_HOST?.trim();
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;

  if (!host || !user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
    tls: {
      rejectUnauthorized: false, // Prevents self-signed cert issues on custom SMTP
    },
  });
}

/**
 * Sends a stylized OTP email for PIN reset
 */
export async function sendOtpEmail({
  to,
  cardId,
  otp,
  businessName,
}: SendOtpParams): Promise<{ sent: boolean; messageId?: string; error?: string }> {
  try {
    const transporter = getMailTransporter();

    if (!transporter) {
      console.warn(
        `[Email] SMTP not configured. OTP for Card ${cardId} (${to}) is: ${otp}`
      );
      return {
        sent: false,
        error: 'SMTP credentials (SMTP_HOST, SMTP_USER, SMTP_PASS) not configured in .env',
      };
    }

    const fromAddress = process.env.SMTP_FROM || `Tapku Security <${process.env.SMTP_USER}>`;
    const targetName = businessName ? ` ${businessName}` : '';

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="id">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Kode Pemulihan PIN Tapku</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; padding: 40px 15px;">
          <tr>
            <td align="center">
              <table role="presentation" width="100%" style="max-width: 500px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06); border: 1px solid #e2e8f0;">
                <!-- Header -->
                <tr>
                  <td style="background: linear-gradient(135deg, #0b132b 0%, #1c2541 100%); padding: 30px; text-align: center;">
                    <div style="display: inline-block; width: 44px; height: 44px; line-height: 44px; background: #2563eb; color: #ffffff; border-radius: 12px; font-size: 22px; font-weight: 800; text-align: center; margin-bottom: 12px;">
                      T
                    </div>
                    <h1 style="color: #ffffff; font-size: 20px; font-weight: 800; margin: 0; letter-spacing: -0.02em;">TAPKU SECURITY</h1>
                    <p style="color: #94a3b8; font-size: 13px; margin: 6px 0 0 0;">Verifikasi Reset PIN Kartu Ulasan Google</p>
                  </td>
                </tr>

                <!-- Content -->
                <tr>
                  <td style="padding: 35px 30px;">
                    <p style="color: #334155; font-size: 15px; line-height: 1.6; margin: 0 0 16px 0;">
                      Halo Pengelola<strong>${targetName}</strong>,
                    </p>
                    <p style="color: #475569; font-size: 14px; line-height: 1.6; margin: 0 0 24px 0;">
                      Kami menerima permintaan untuk mengatur ulang PIN pada kartu pintar ID: <strong style="color: #0f172a; font-family: monospace;">${cardId}</strong>. Gunakan kode verifikasi di bawah ini untuk melanjutkan:
                    </p>

                    <!-- OTP Box -->
                    <div style="background: #f0fdf4; border: 2px dashed #22c55e; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 24px;">
                      <span style="font-family: 'Courier New', Courier, monospace; font-size: 36px; font-weight: 900; letter-spacing: 10px; color: #15803d; display: inline-block; margin-left: 10px;">
                        ${otp}
                      </span>
                    </div>

                    <div style="background: #fef2f2; border-left: 4px solid #ef4444; border-radius: 4px; padding: 12px; margin-bottom: 24px;">
                      <p style="color: #991b1b; font-size: 12px; line-height: 1.5; margin: 0;">
                        ⏱️ <strong>Kode ini berlaku selama 10 menit.</strong> Jangan pernah bagikan kode ini kepada siapa pun termasuk staf atau pihak yang mengaku dari Tapku.
                      </p>
                    </div>

                    <p style="color: #64748b; font-size: 13px; line-height: 1.5; margin: 0;">
                      Jika Anda tidak meminta pengaturan ulang PIN ini, abaikan email ini. PIN kartu Anda tetap aman.
                    </p>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background-color: #f8fafc; padding: 20px 30px; text-align: center; border-top: 1px solid #e2e8f0;">
                    <p style="color: #94a3b8; font-size: 12px; margin: 0;">
                      &copy; ${new Date().getFullYear()} Tapku Platform. Hak cipta dilindungi.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    const info = await transporter.sendMail({
      from: fromAddress,
      to,
      subject: `Kode Verifikasi Reset PIN Tapku (${cardId})`,
      text: `Kode verifikasi Reset PIN kartu Anda (${cardId}) adalah: ${otp}\n\nKode berlaku selama 10 menit. Jangan bagikan kode ini kepada siapa pun.`,
      html: htmlContent,
    });

    console.log(`[Email Sent] MessageId: ${info.messageId} to ${to}`);
    return { sent: true, messageId: info.messageId };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('[Send OTP Error]', errorMsg);
    return { sent: false, error: errorMsg };
  }
}

/**
 * Tests SMTP configuration connectivity and sends a test email
 */
export async function testSmtpConnection(testRecipient?: string): Promise<SmtpTestResult> {
  const host = process.env.SMTP_HOST?.trim();
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();
  const from = process.env.SMTP_FROM?.trim() || `${user}`;
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;

  if (!host || !user || !pass) {
    return {
      success: false,
      message: 'Konfigurasi SMTP belum lengkap di file .env / .env.local',
      details: {
        host: host || '(kosong)',
        port,
        user: user || '(kosong)',
        from: from || '(kosong)',
        secure,
      },
      error: 'Variabel lingkungan SMTP_HOST, SMTP_USER, dan SMTP_PASS wajib diisi.',
    };
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
      tls: { rejectUnauthorized: false },
    });

    // 1. Verify connection and authentication
    await transporter.verify();

    // 2. Optionally send test email
    if (testRecipient) {
      await transporter.sendMail({
        from: process.env.SMTP_FROM || `Tapku Test <${user}>`,
        to: testRecipient,
        subject: 'Tes Koneksi SMTP Email Tapku — Berhasil!',
        text: 'Ini adalah email uji coba untuk memverifikasi bahwa konfigurasi SMTP Tapku berfungsi normal.',
        html: `
          <div style="font-family: sans-serif; padding: 20px; border: 1px solid #22c55e; border-radius: 8px;">
            <h2 style="color: #16a34a; margin-top: 0;">✓ Koneksi SMTP Berhasil!</h2>
            <p>Pengiriman email dari server Tapku telah berhasil terhubung dan diverifikasi dengan sukses.</p>
            <p style="font-size: 12px; color: #64748b;">Host: ${host} | Port: ${port} | User: ${user}</p>
          </div>
        `,
      });
    }

    return {
      success: true,
      message: testRecipient
        ? `Koneksi SMTP sukses dan email uji coba berhasil dikirim ke ${testRecipient}.`
        : 'Koneksi dan autentikasi SMTP berhasil diverifikasi.',
      details: { host, port, user, from, secure },
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      message: 'Gagal menghubungkan ke server SMTP.',
      details: { host, port, user, from, secure },
      error: errorMsg,
    };
  }
}
