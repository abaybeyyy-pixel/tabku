import { NextRequest, NextResponse } from 'next/server';
import { getAllCards, getCardStats } from '@/lib/db-helpers';
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

    const cards = getAllCards(search, status);
    const stats = getCardStats();

    return NextResponse.json({
      success: true,
      cards,
      stats,
    });
  } catch (error) {
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
  }
}
