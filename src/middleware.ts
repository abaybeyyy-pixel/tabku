import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const host = request.headers.get('host') || '';
  
  // If request is coming from old domain (tabku.vercel.app or any vercel.app domain)
  // redirect permanently (308) to official custom domain mycarrd.com
  if (host.includes('tabku.vercel.app') || (host.includes('.vercel.app') && !host.includes('localhost'))) {
    const url = request.nextUrl.clone();
    url.protocol = 'https:';
    url.host = 'mycarrd.com';
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
