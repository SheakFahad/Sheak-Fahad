import { isSupabaseConfigured } from '@/lib/content/repository'

export const dynamic = 'force-dynamic'

/**
 * Placeholder until Phase 7–8. Exposes no data and no actions.
 * The real dashboard (Supabase Auth + RLS-protected CMS + Media Library) replaces this page.
 */
export default function AdminPlaceholder() {
  const configured = isSupabaseConfigured()
  return (
    <main className="grid min-h-dvh place-items-center p-6">
      <div className="glass max-w-lg rounded-[var(--radius-panel)] p-8 text-center">
        <p className="eyebrow">Private area</p>
        <h1 className="mt-3 text-2xl">Admin dashboard</h1>
        <p className="mt-4 text-[var(--text-2)]">
          {configured
            ? 'Supabase is configured. Sign-in and the content manager are enabled in the admin phase.'
            : 'The secure admin dashboard becomes available once Supabase is connected (see docs/DEPLOYMENT_GUIDE.md).'}
        </p>
      </div>
    </main>
  )
}
