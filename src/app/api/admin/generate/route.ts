import { NextRequest, NextResponse } from 'next/server';
import { generateCards } from '@/lib/db-helpers';
import { verifyAdminPassword } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { password, prefix = '', count = 10 } = body;

    if (!verifyAdminPassword(password)) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    if (prefix && prefix.length > 5) {
      return NextResponse.json({ error: 'Prefix maksimal 5 karakter.' }, { status: 400 });
    }

    if (!count || count < 1 || count > 1000) {
      return NextResponse.json({ error: 'Jumlah harus antara 1 dan 1.000.' }, { status: 400 });
    }

    const cardIds = await generateCards(prefix ? prefix.toUpperCase() : '', count);

    return NextResponse.json({
      success: true,
      message: `Berhasil membuat ${cardIds.length} ID kartu acak 6 digit.`,
      count: cardIds.length,
      cardIds,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'An unexpected error occurred.' }, { status: 500 });
  }
}
