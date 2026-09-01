import { NextRequest, NextResponse } from 'next/server';
import { getAllCards, getCardStats, deleteCards } from '@/lib/db-helpers';
import { verifyAdminPassword } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || undefined;
    const status = searchParams.get('status') || undefined;
    const password = request.headers.get('x-admin-password') || '';

    if (!verifyAdminPassword(password)) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const cards = await getAllCards(search, status);
    const stats = await getCardStats();

    return NextResponse.json({
      success: true,
      cards,
      stats,
    });
  } catch {
    return NextResponse.json({ error: 'Terjadi kesalahan sistem.' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const password = request.headers.get('x-admin-password') || '';

    if (!verifyAdminPassword(password)) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const body = await request.json();
    const { cardIds } = body;

    if (!cardIds || !Array.isArray(cardIds) || cardIds.length === 0) {
      return NextResponse.json({ error: 'Daftar ID kartu wajib disertakan.' }, { status: 400 });
    }

    const success = await deleteCards(cardIds);
    if (!success) {
      return NextResponse.json({ error: 'Gagal menghapus beberapa kartu.' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Berhasil menghapus ${cardIds.length} kartu terpilih.`,
      count: cardIds.length,
    });
  } catch {
    return NextResponse.json({ error: 'Terjadi kesalahan sistem.' }, { status: 500 });
  }
}
