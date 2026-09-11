import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const host = request.headers.get('host') || '';
  
  // Get canonical domain from environment
  const targetDomain = process.env.NEXT_PUBLIC_DOMAIN || 'https://mycarrd.com';
  let targetHost = 'mycarrd.com';
  try {
    targetHost = new URL(targetDomain).host;
  } catch {
    targetHost = 'mycarrd.com';
  }

  // Never redirect if already on target host or localhost
  if (host === targetHost || host.includes('localhost') || host.startsWith('127.0.0.1') || host.startsWith('10.')) {
    return NextResponse.next();
  }
  
  // If request is coming from old domain (tabku.vercel.app or any vercel.app domain)
  // redirect permanently (308) to official custom domain
  if (host.includes('tabku.vercel.app') || host.includes('.vercel.app')) {
    const url = request.nextUrl.clone();
    url.protocol = 'https:';
    url.host = targetHost;
    url.port = '';
    return NextResponse.redirect(url, 308);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
