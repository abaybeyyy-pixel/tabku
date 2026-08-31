import { NextRequest, NextResponse } from 'next/server';
import { generateCards } from '@/lib/db-helpers';
import { verifyAdminPassword } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { password, prefix, count } = body;

    if (!verifyAdminPassword(password)) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    if (!prefix || prefix.length < 1 || prefix.length > 4) {
      return NextResponse.json({ error: 'Prefix must be 1-4 characters.' }, { status: 400 });
    }

    if (!count || count < 1 || count > 10000) {
      return NextResponse.json({ error: 'Count must be between 1 and 10,000.' }, { status: 400 });
    }

    const cardIds = generateCards(prefix.toUpperCase(), count);

    return NextResponse.json({
      success: true,
      message: `Generated ${cardIds.length} cards.`,
      count: cardIds.length,
      cardIds,
    });
  } catch {
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
  }
}
