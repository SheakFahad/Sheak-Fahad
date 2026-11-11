import createIntlMiddleware from 'next-intl/middleware'
import { routing } from './i18n/routing'

// Locale negotiation for the public site.
// /admin and /api are excluded here; the admin guard (Supabase session + is_admin) is added in Phase 8.
export default createIntlMiddleware(routing)

export const config = {
  matcher: ['/((?!api|admin|_next|_vercel|.*\\..*).*)'],
}
