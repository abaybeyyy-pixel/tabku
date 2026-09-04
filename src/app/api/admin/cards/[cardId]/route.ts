import { NextRequest, NextResponse } from 'next/server';
import { deleteCard, adminResetPin, updateCardPrintedStatus, findCardById } from '@/lib/db-helpers';
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
    const { action, newPin, isPrinted } = body;

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

    if (action === 'toggle-printed') {
      const card = await findCardById(cardId);
      if (!card) {
        return NextResponse.json({ error: 'Kartu tidak ditemukan.' }, { status: 404 });
      }
      const targetStatus = !card.is_printed;
      const success = await updateCardPrintedStatus([cardId], targetStatus);
      if (!success) {
        return NextResponse.json({ error: 'Gagal memperbarui status cetak.' }, { status: 500 });
      }
      return NextResponse.json({
        success: true,
        isPrinted: targetStatus,
        message: targetStatus ? `Kartu ${cardId} ditandai sudah dicetak.` : `Kartu ${cardId} ditandai belum dicetak.`,
      });
    }

    if (action === 'set-printed') {
      const success = await updateCardPrintedStatus([cardId], !!isPrinted);
      if (!success) {
        return NextResponse.json({ error: 'Gagal memperbarui status cetak.' }, { status: 500 });
      }
      return NextResponse.json({
        success: true,
        isPrinted: !!isPrinted,
        message: isPrinted ? `Kartu ${cardId} ditandai sudah dicetak.` : `Kartu ${cardId} ditandai belum dicetak.`,
      });
    }

    return NextResponse.json({ error: 'Aksi tidak valid.' }, { status: 400 });
  } catch {
    return NextResponse.json({ error: 'Terjadi kesalahan sistem.' }, { status: 500 });
  }
}
