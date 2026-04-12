import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function proxy(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value
  const isAuthPage = request.nextUrl.pathname === '/' || request.nextUrl.pathname === '/login'

  // If user is not authenticated and trying to access protected route
  if (!token && !isAuthPage) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // If user is authenticated and trying to access login page
  if (token && isAuthPage) {
    return NextResponse.redirect(new URL('/tenants', request.url))
  }

  return NextResponse.next()
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
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
}
