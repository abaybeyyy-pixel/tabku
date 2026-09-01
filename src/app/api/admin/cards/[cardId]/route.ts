import { NextRequest, NextResponse } from 'next/server';
import { deleteCard, adminResetPin } from '@/lib/db-helpers';
import { verifyAdminPassword, hashPin } from '@/lib/auth';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ cardId: string }> }
) {
  try {
    const { cardId } = await params;
    const password = request.headers.get('x-admin-password') || '';

    if (!verifyAdminPassword(password)) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const success = await deleteCard(cardId);
    if (!success) {
      return NextResponse.json({ error: 'Gagal menghapus kartu.' }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: `Kartu ${cardId} berhasil dihapus.` });
  } catch {
    return NextResponse.json({ error: 'Terjadi kesalahan sistem.' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ cardId: string }> }
) {
  try {
    const { cardId } = await params;
    const password = request.headers.get('x-admin-password') || '';

    if (!verifyAdminPassword(password)) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const body = await request.json();
    const { action, newPin } = body;

    if (action === 'delete') {
      const success = await deleteCard(cardId);
      if (!success) {
        return NextResponse.json({ error: 'Gagal menghapus kartu.' }, { status: 400 });
      }
      return NextResponse.json({ success: true, message: `Kartu ${cardId} berhasil dihapus.` });
    }

    if (action === 'reset-pin') {
      if (!newPin || newPin.length < 4 || newPin.length > 6 || !/^\d+$/.test(newPin)) {
        return NextResponse.json({ error: 'PIN harus 4-6 digit angka.' }, { status: 400 });
      }
      const pinHash = await hashPin(newPin);
      const success = await adminResetPin(cardId, pinHash);
      if (!success) {
        return NextResponse.json({ error: 'Gagal mengatur ulang PIN.' }, { status: 400 });
      }
      return NextResponse.json({ success: true, message: 'PIN berhasil diubah.' });
    }

    return NextResponse.json({ error: 'Aksi tidak valid.' }, { status: 400 });
  } catch {
    return NextResponse.json({ error: 'Terjadi kesalahan sistem.' }, { status: 500 });
  }
}
