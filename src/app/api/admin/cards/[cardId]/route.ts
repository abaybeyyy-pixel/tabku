import { NextRequest, NextResponse } from 'next/server';
import { disableCard, reactivateCard, adminResetPin } from '@/lib/db-helpers';
import { verifyAdminPassword, hashPin } from '@/lib/auth';

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

    if (action === 'disable') {
      const success = disableCard(cardId);
      if (!success) {
        return NextResponse.json({ error: 'Failed to disable card.' }, { status: 400 });
      }
      return NextResponse.json({ success: true, message: 'Card disabled successfully.' });
    }

    if (action === 'reactivate') {
      const success = reactivateCard(cardId);
      if (!success) {
        return NextResponse.json({ error: 'Failed to reactivate card. Ensure it is currently DISABLED.' }, { status: 400 });
      }
      return NextResponse.json({ success: true, message: 'Card reactivated successfully.' });
    }

    if (action === 'reset-pin') {
      if (!newPin || newPin.length < 4 || newPin.length > 6 || !/^\d+$/.test(newPin)) {
        return NextResponse.json({ error: 'PIN must be 4-6 digits.' }, { status: 400 });
      }
      const pinHash = await hashPin(newPin);
      const success = adminResetPin(cardId, pinHash);
      if (!success) {
        return NextResponse.json({ error: 'Failed to reset PIN.' }, { status: 400 });
      }
      return NextResponse.json({ success: true, message: 'PIN reset successfully.' });
    }

    return NextResponse.json({ error: 'Invalid action.' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
  }
}
