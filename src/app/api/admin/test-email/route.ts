import { NextRequest, NextResponse } from 'next/server';
import { testSmtpConnection } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { testEmail } = body;

    const result = await testSmtpConnection(testEmail);

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Terjadi kesalahan sistem.';
    return NextResponse.json(
      { success: false, error: errorMsg },
      { status: 500 }
    );
  }
}
