import { NextRequest, NextResponse } from 'next/server';
import { resolveGoogleMapsReviewUrl } from '@/lib/url-resolver';

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();
    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }
    const resolvedUrl = await resolveGoogleMapsReviewUrl(url);
    return NextResponse.json({ resolvedUrl });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to resolve URL' }, { status: 500 });
  }
}
