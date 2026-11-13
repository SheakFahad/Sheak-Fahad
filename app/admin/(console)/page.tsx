import Link from 'next/link'
import { requireAdmin } from '@/lib/admin/auth'
import { ADMIN_NAV } from '@/lib/admin/nav'

export const dynamic = 'force-dynamic'

interface Overview {
  pages: number
  sections: number
  sections_published: number
  drafts: number
  projects: number
  media: number
  storage_bytes: number
  unread_messages: number
  travel: number
}

const fmtBytes = (n: number) =>
  n < 1024 ? `${n} B` : n < 1048576 ? `${(n / 1024).toFixed(1)} KB` : n < 1073741824 ? `${(n / 1048576).toFixed(1)} MB` : `${(n / 1073741824).toFixed(2)} GB`
const fmtTime = (s: string) => new Date(s).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })

/** Dashboard overview — every number comes from the database (admin_overview RPC). */
export default async function Dashboard() {
  const admin = await requireAdmin()
  const [overview, logs, uploads] = await Promise.all([
    admin.sb.rpc('admin_overview'),
    admin.sb.from('audit_logs').select('id, action, entity_type, summary, actor_email, created_at').order('created_at', { ascending: false }).limit(8),
    admin.sb.from('media_assets').select('id, title, original_filename, kind, created_at').is('deleted_at', null).order('created_at', { ascending: false }).limit(6),
  ])
  const o = overview.data as Overview | null

  const stats: [string, string | number | null][] = [
    ['Pages', o?.pages ?? null],
    ['Sections', o?.sections ?? null],
    ['Published sections', o?.sections_published ?? null],
    ['Drafts', o?.drafts ?? null],
    ['Projects', o?.projects ?? null],
    ['Media files', o?.media ?? null],
    ['Storage used', o ? fmtBytes(o.storage_bytes) : null],
    ['Unread messages', o?.unread_messages ?? null],
  ]
  const actions: [string, string][] = [
    ['Create page', '/admin/pages'],
    ['Create section', '/admin/sections'],
    ['Upload media', '/admin/media'],
    ['Add project', '/admin/projects'],
    ['Add travel location', '/admin/travel'],
    ['Open messages', '/admin/messages'],
  ]
  const ready = (href: string) => ADMIN_NAV.find(i => i.href === href)?.ready

  return (
    <div className="grid gap-8">
      <div>
        <h1 className="text-2xl">Dashboard</h1>
        <p className="mt-1 text-sm text-[var(--text-2)]">Live numbers from the database.</p>
      </div>

      {overview.error ? (
        <p role="alert" className="admin-card p-4 text-sm text-[var(--danger)]">
          Could not load the overview ({overview.error.message}). Check that every migration has been applied.
        </p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map(([label, value]) => (
            <li key={label} className="admin-card p-4">
              <p className="text-xs text-[var(--text-2)]">{label}</p>
              <p className="mt-1 text-2xl font-bold tabular-nums">{value ?? '—'}</p>
            </li>
          ))}
        </ul>
      )}

      <section aria-labelledby="qa">
        <h2 id="qa" className="mb-3 text-base">
          Quick actions
        </h2>
        <ul className="flex flex-wrap gap-2">
          {actions.map(([label, href]) => (
            <li key={href}>
              {ready(href) ? (
                <Link href={href} className="admin-btn">
                  {label}
                </Link>
              ) : (
                <span className="admin-btn is-disabled" aria-disabled="true" title="Coming soon">
                  {label} · soon
                </span>
              )}
            </li>
          ))}
        </ul>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section aria-labelledby="ru" className="admin-card p-5">
          <h2 id="ru" className="text-base">
            Recent updates
          </h2>
          {logs.data?.length ? (
            <ul className="mt-3 grid gap-2 text-sm">
              {logs.data.map(l => (
                <li key={l.id} className="flex flex-wrap justify-between gap-2 border-b border-[var(--line)] pb-2 last:border-0">
                  <span>
                    <span className="font-mono text-xs text-[var(--cyan)]">{l.action}</span> {l.summary ?? l.entity_type}
                  </span>
                  <span className="text-xs text-[var(--text-2)]">
                    {l.actor_email} · {fmtTime(l.created_at)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-[var(--text-2)]">No activity yet.</p>
          )}
        </section>
        <section aria-labelledby="up" className="admin-card p-5">
          <h2 id="up" className="text-base">
            Recent uploads
          </h2>
          {uploads.data?.length ? (
            <ul className="mt-3 grid gap-2 text-sm">
              {uploads.data.map(m => (
                <li key={m.id} className="flex justify-between gap-2 border-b border-[var(--line)] pb-2 last:border-0">
                  <span className="truncate">{m.title || m.original_filename || m.id}</span>
                  <span className="shrink-0 text-xs text-[var(--text-2)]">
                    {m.kind} · {fmtTime(m.created_at)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-[var(--text-2)]">No uploads yet.</p>
          )}
        </section>
      </div>
    </div>
  )
}
