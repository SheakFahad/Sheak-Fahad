import { AdminShell } from '@/components/admin/AdminShell'
import { requireAdmin } from '@/lib/admin/auth'
import { isSupabaseConfigured } from '@/lib/env'

export const dynamic = 'force-dynamic'

/** Every console page is guarded here (server-side) — and every server action checks again. */
export default async function ConsoleLayout({ children }: { children: React.ReactNode }) {
  if (!isSupabaseConfigured()) {
    return (
      <main className="grid min-h-dvh place-items-center p-6">
        <div className="admin-card max-w-lg p-8">
          <p className="text-xs font-semibold tracking-[0.18em] text-[var(--cyan)] uppercase">Setup required</p>
          <h1 className="mt-2 text-2xl">Connect the database</h1>
          <p className="mt-3 text-sm text-[var(--text-2)]">
            The admin dashboard needs Supabase. Create the project, run the migrations and add the environment variables (docs/DATABASE_SETUP.md,
            docs/ENVIRONMENT_VARIABLES.md), then redeploy. The public website keeps working from its built-in content meanwhile.
          </p>
        </div>
      </main>
    )
  }
  const admin = await requireAdmin()
  const { count } = await admin.sb.from('messages').select('id', { count: 'exact', head: true }).eq('status', 'new')
  return (
    <AdminShell name={admin.name} role={admin.role} unread={count ?? 0}>
      {children}
    </AdminShell>
  )
}
