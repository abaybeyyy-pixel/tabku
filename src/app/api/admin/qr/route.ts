import { NextRequest, NextResponse } from 'next/server';
import { generateQRDataURL, generateQRSVG } from '@/lib/qr-generator';
import { verifyAdminPassword } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const password = request.headers.get('x-admin-password') || '';
    if (!verifyAdminPassword(password)) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const body = await request.json();
    const { cardIds, format } = body; // format: 'png' | 'svg'

    if (!cardIds || !Array.isArray(cardIds)) {
      return NextResponse.json({ error: 'Card IDs array is required.' }, { status: 400 });
    }

    const results = [];
    for (const cardId of cardIds) {
      if (format === 'svg') {
        const svg = await generateQRSVG(cardId);
        results.push({ cardId, data: svg });
      } else {
        const png = await generateQRDataURL(cardId);
        results.push({ cardId, data: png });
      }
    }

    return NextResponse.json({ success: true, results });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'An unexpected error occurred.' }, { status: 500 });
  }
}
