import createIntlMiddleware from 'next-intl/middleware'
import type { NextRequest } from 'next/server'
import { routing } from './i18n/routing'
import { refreshSupabaseSession } from './lib/supabase/proxy'

const intl = createIntlMiddleware(routing)

// Public site: locale negotiation. /admin: Supabase session refresh (the real guard runs server-side in
// the admin layout and in every server action — the proxy never decides access on its own).
export default function proxy(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/admin')) return refreshSupabaseSession(request)
  return intl(request)
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
}
