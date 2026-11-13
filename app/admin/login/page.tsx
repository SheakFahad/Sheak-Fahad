import { redirect } from 'next/navigation'
import { SFMark } from '@/components/layout/SFMark'
import { getAdmin } from '@/lib/admin/auth'
import { isSupabaseConfigured } from '@/lib/env'
import { LoginForm } from './LoginForm'

export const dynamic = 'force-dynamic'

export default async function AdminLogin() {
  const configured = isSupabaseConfigured()
  if (configured && (await getAdmin())) redirect('/admin')
  return (
    <main className="grid min-h-dvh place-items-center bg-[var(--bg)] p-4">
      <div className="admin-card w-full max-w-sm p-8">
        <div className="flex items-center gap-3">
          <SFMark className="size-10" />
          <div>
            <h1 className="text-lg">Admin sign in</h1>
            <p className="text-xs text-[var(--text-2)]">Sheak Fahad — Portfolio CMS</p>
          </div>
        </div>
        {!configured && (
          <p className="mt-6 rounded-lg bg-[var(--warn)]/10 px-3 py-2 text-sm text-[var(--warn)]">
            The database is not connected yet. Follow docs/DATABASE_SETUP.md, add the Supabase variables and redeploy.
          </p>
        )}
        <LoginForm disabled={!configured} />
        <p className="mt-6 text-xs text-[var(--text-2)]">Accounts are created by the owner. There is no public sign-up.</p>
      </div>
    </main>
  )
}
