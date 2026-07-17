import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PUBLIC_PATHS = ['/onboarding']

export function proxy(request: NextRequest) {
  const token = request.cookies.get('access_token')?.value
  const path = request.nextUrl.pathname
  const isPublic = PUBLIC_PATHS.some(p => path.startsWith(p))

  if (!token && !isPublic) {
    return NextResponse.redirect(new URL('/onboarding', request.url))
  }
  if (token && path === '/onboarding') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|manifest.json|icon-).*)'],
}
